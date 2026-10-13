-- Lecture uniquement : les horodatages UTC restent inchangés.
-- Les migrations de Florésia déclarent ces colonnes TIMESTAMP sans fuseau.
SELECT
  "id",
  "createdAt" AS creation_utc,
  "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris' AS creation_paris,
  "updatedAt" AS modification_utc,
  "updatedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris' AS modification_paris
FROM public."User"
ORDER BY "createdAt" DESC
LIMIT 20;
