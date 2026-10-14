import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RegisterDto } from '../auth/dto/register.dto';
import { LoginDto } from '../auth/dto/login.dto';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import { ChangePasswordDto } from '../auth/dto/change-password.dto';
import { ForgotPasswordDto } from '../auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '../auth/dto/reset-password.dto';
import { ResendCodeDto } from '../auth/dto/resend-code.dto';
import { VerifyEmailDto } from '../auth/dto/verify-email.dto';
import { CreateAddressDto } from '../addresses/dto/create-address.dto';
import { UpdateAddressDto } from '../addresses/dto/update-address.dto';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { UpdateProductDto } from '../products/dto/update-product.dto';
import { CreateFlowerDto } from '../flowers/dto/create-flower.dto';
import { UpdateFlowerDto } from '../flowers/dto/update-flower.dto';
import { CreateTestimonialDto } from '../testimonials/dto/create-testimonial.dto';
import { SubmitTestimonialDto } from '../testimonials/dto/submit-testimonial.dto';
import { UpdateTestimonialDto } from '../testimonials/dto/update-testimonial.dto';
import { CreateGalleryPhotoDto } from '../gallery/dto/create-gallery-photo.dto';
import { SubmitGalleryPhotoDto } from '../gallery/dto/submit-gallery-photo.dto';
import { UpdateGalleryPhotoDto } from '../gallery/dto/update-gallery-photo.dto';
import { CreateArticleDto } from '../articles/dto/create-article.dto';
import { UpdateArticleDto } from '../articles/dto/update-article.dto';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { UpdateCommentDto } from '../comments/dto/update-comment.dto';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { UpdateOrderDto } from '../orders/dto/update-order.dto';
import { UpdateUserRoleDto } from '../users/dto/update-user-role.dto';
import { CreateCheckoutSessionDto } from '../payment/dto/create-checkout-session.dto';
import { SendMessageDto } from '../chatbot/dto/send-message.dto';
import {
  DeleteAccountDto,
  DeletionTokenDto,
  DeletionDocumentDto,
} from '../auth/dto/account-deletion.dto';

const models = [
  DeleteAccountDto,
  DeletionTokenDto,
  DeletionDocumentDto,
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ResendCodeDto,
  VerifyEmailDto,
  CreateAddressDto,
  UpdateAddressDto,
  CreateProductDto,
  UpdateProductDto,
  CreateFlowerDto,
  UpdateFlowerDto,
  CreateTestimonialDto,
  SubmitTestimonialDto,
  UpdateTestimonialDto,
  CreateGalleryPhotoDto,
  SubmitGalleryPhotoDto,
  UpdateGalleryPhotoDto,
  CreateArticleDto,
  UpdateArticleDto,
  CreateCommentDto,
  UpdateCommentDto,
  CreateOrderDto,
  UpdateOrderDto,
  UpdateUserRoleDto,
  CreateCheckoutSessionDto,
  SendMessageDto,
];

describe('Swagger : exemples fictifs et formulaires complets', () => {
  it('documente chaque champ, y compris ceux des DTO de mise à jour', async () => {
    const module = await Test.createTestingModule({}).compile();
    const app = module.createNestApplication();
    try {
      await app.init();
      const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().build(),
        { extraModels: models },
      );
      const schemas = document.components?.schemas as Record<
        string,
        {
          properties?: Record<string, { example?: unknown }>;
          required?: string[];
        }
      >;
      for (const model of models) {
        expect(schemas[model.name]?.properties).toBeDefined();
        for (const property of Object.values(schemas[model.name].properties!))
          expect(property.example).toBeDefined();
      }
      expect(JSON.stringify(schemas)).not.toMatch(
        /Selsabil|Amairi|selsabil@gmail\.com/i,
      );
      expect(schemas.RegisterDto.properties?.email.example).toBe(
        'utilisateur@example.com',
      );
      expect(schemas.RegisterDto.properties?.phone).toBeUndefined();
      expect(schemas.UpdateFlowerDto.required || []).toEqual([]);
      expect(schemas.CreateOrderDto.properties?.items.example).toEqual([
        { productId: 'id-produit-exemple', quantity: 1 },
      ]);
    } finally {
      await app.close();
    }
  });
});
