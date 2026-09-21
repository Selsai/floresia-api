import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';
import { ChatbotService, CUSTOM_BOUQUET_PRODUCT_ID } from './chatbot.service';

jest.mock('@google/genai', () => ({ GoogleGenAI: jest.fn() }));

describe('ChatbotService : contexte et erreurs', () => {
  let service: ChatbotService;
  let generateContent: jest.Mock;
  let findMany: jest.Mock;
  let findFlowers: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    generateContent = jest.fn().mockResolvedValue({ text: 'Bonjour !' });
    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent },
    }));
    findMany = jest.fn().mockResolvedValue([
      { name: 'Bouquet témoin', description: 'Roses', category: 'AUTRE', price: 45 },
    ]);
    findFlowers = jest.fn().mockResolvedValue([]);
    service = new ChatbotService(
      { get: () => 'test-key' } as unknown as ConfigService,
      { product: { findMany }, flower: { findMany: findFlowers } } as unknown as PrismaService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it.each([
    ['2026-01-15T12:00:00Z', '15 janvier 2026'],
    ['2026-09-16T12:00:00Z', '16 septembre 2026'],
    ['2026-03-31T22:30:00Z', '1 avril 2026'],
  ])('utilise la date à Paris : %s', async (instant, date) => {
    jest.setSystemTime(new Date(instant));
    await service.sendMessage({ message: 'Quelles fleurs en ce moment ?' }, instant);
    const { config } = generateContent.mock.calls[0][0];
    expect(config.systemInstruction).toContain(date);
    expect(config.systemInstruction).toContain('Paris / Île-de-France');
    expect(config.httpOptions.timeout).toBe(12_000);
  });

  it('conserve le contexte réel malgré une ancienne réponse erronée', async () => {
    jest.setSystemTime(new Date('2026-09-16T12:00:00Z'));
    await service.sendMessage({
      message: 'Et maintenant ?',
      history: [{ role: 'model', content: 'Nous sommes au printemps.' }],
    }, 'history-test');
    const request = generateContent.mock.calls[0][0];
    expect(request.config.systemInstruction).toContain('16 septembre 2026');
    expect(request.config.systemInstruction).toContain('Une erreur dans l\'historique doit être corrigée');
    expect(request.config.systemInstruction).toContain('Bouquet témoin (Autre, 45€)');
    expect(request.contents[0].parts[0].text).toBe('Nous sommes au printemps.');
  });

  it('signale explicitement un catalogue vide', async () => {
    findMany.mockResolvedValue([]);
    await service.sendMessage({ message: 'Quel bouquet acheter ?' }, 'empty-catalog');
    expect(generateContent.mock.calls[0][0].config.systemInstruction)
      .toContain('Ne recommande aucun produit précis.');
  });

  it('répond au prix depuis la base sans utiliser une réponse inventée par Gemini', async () => {
    generateContent.mockResolvedValue({ text: 'Le bouquet Inventé coûte 99 €.' });
    await expect(service.sendMessage({
      message: 'Quel est le prix du bouquet témoin ?',
      history: [{ role: 'model', content: 'Ce bouquet n’existe pas.' }],
    }, 'actual-price')).resolves.toEqual({ reply: 'Le bouquet « Bouquet témoin » coûte 45,00 €, hors livraison.' });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('transmet aussi les feuillages et leurs prix à Gemini', async () => {
    findFlowers.mockResolvedValue([{ name: 'Eucalyptus', color: 'Vert', price: 2, stock: 100, isSecondary: true }]);
    await service.sendMessage({ message: 'Comment entretenir mon eucalyptus ?' }, 'secondary-context');
    expect(findFlowers).toHaveBeenCalledWith(expect.objectContaining({ where: { stock: { gt: 0 } } }));
    expect(generateContent.mock.calls[0][0].config.systemInstruction)
      .toContain('Eucalyptus (complément optionnel) : Vert (2€) par tige, sans lot');
  });

  it('inclut les vrais bouquets personnalisables en excluant seulement le produit interne', async () => {
    await service.sendMessage({ message: 'Quel bouquet choisir ?' }, 'real-catalog');
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { not: CUSTOM_BOUQUET_PRODUCT_ID } },
    }));
    expect(generateContent.mock.calls[0][0].config.systemInstruction).toContain('Bouquet témoin');
  });

  it('ne relance pas un refus de localisation et conserve une erreur publique sans détail technique', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    generateContent.mockRejectedValue({ status: 400, message: 'User location is not supported' });
    await expect(service.sendMessage({ message: 'Bonjour' }, 'location-test'))
      .rejects.toThrow('Le chatbot est momentanément indisponible');
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it('passe directement au modèle de secours si le quota du premier est épuisé', async () => {
    generateContent.mockRejectedValueOnce({ status: 429, message: 'Quota exceeded' });
    await expect(service.sendMessage({ message: 'Bonjour' }, 'quota-fallback'))
      .resolves.toEqual({ reply: 'Bonjour !' });
    expect(generateContent.mock.calls.map(([request]) => request.model))
      .toEqual(['gemini-flash-lite-latest', 'gemini-flash-latest']);
  });

  it('explique l’indisponibilité lorsque les deux modèles ont épuisé leur quota', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    generateContent.mockRejectedValue({ status: 429, message: 'Quota exceeded' });
    await expect(service.sendMessage({ message: 'Bonjour' }, 'all-quotas'))
      .rejects.toThrow('Flora a atteint sa limite de demandes');
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
});
