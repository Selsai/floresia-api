CREATE TABLE "AdminNotification" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  payload JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  attempts INTEGER NOT NULL DEFAULT 0,
  "firstAttemptAt" TIMESTAMP(3)
);
CREATE INDEX "AdminNotification_sentAt_nextAttemptAt_idx" ON "AdminNotification"("sentAt", "nextAttemptAt");
-- File strictement serveur : aucune lecture depuis les clients Supabase publics.
ALTER TABLE "AdminNotification" ENABLE ROW LEVEL SECURITY;

-- Action et alerte sont enregistrées ensemble, sans appel réseau.
-- Seules les nouvelles actions sont concernées, aucun rattrapage historique.
CREATE FUNCTION floresia_admin_notification() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  actor_id TEXT;
  event_id TEXT;
  event_title TEXT;
  details JSONB := '{}'::jsonb;
  actor_name TEXT;
  actor_email TEXT;
BEGIN
  IF TG_TABLE_NAME = 'User' THEN
    actor_id := NEW.id;
    IF TG_OP = 'INSERT' THEN
      event_id := 'account-created/' || NEW.id;
      event_title := 'Nouveau compte créé';
    ELSIF OLD."deletionRequestedAt" IS NULL AND NEW."deletionRequestedAt" IS NOT NULL THEN
      event_id := 'account-deletion/' || NEW.id || '/' || NEW."deletionRequestedAt"::text;
      event_title := 'Suppression de compte demandée';
    ELSE RETURN NEW;
    END IF;
    actor_name := NEW."firstName" || ' ' || NEW."lastName";
    actor_email := NEW.email;
  ELSIF TG_TABLE_NAME = 'Order' THEN
    IF NEW.status <> 'PAID' OR OLD.status <> 'PENDING' THEN RETURN NEW; END IF;
    actor_id := NEW."userId";
    event_id := 'order-paid/' || NEW.id;
    event_title := 'Nouvelle commande payée (test)';
    details := jsonb_build_object('reference', NEW.id, 'amount', NEW."totalAmount");
  ELSIF TG_TABLE_NAME = 'Comment' THEN
    actor_id := NEW."authorId";
    event_id := 'comment/' || NEW.id;
    event_title := 'Nouveau commentaire';
    details := jsonb_build_object('content', NEW.content, 'alias', NEW."publicAlias");
  ELSIF TG_TABLE_NAME = 'Testimonial' THEN
    actor_id := NEW."authorId";
    IF actor_id IS NULL THEN RETURN NEW; END IF;
    event_id := 'review/' || NEW.id;
    event_title := 'Nouvel avis';
    details := jsonb_build_object('content', NEW.content, 'rating', NEW.rating, 'alias', NEW."authorName");
  ELSE RETURN NEW;
  END IF;
  IF actor_email IS NULL THEN
    SELECT "firstName" || ' ' || "lastName", email INTO actor_name, actor_email FROM "User" WHERE id = actor_id;
  END IF;
  INSERT INTO "AdminNotification" (id, title, payload)
  VALUES (event_id, event_title, details || jsonb_build_object('name', actor_name, 'email', actor_email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER floresia_user_admin_notification AFTER INSERT OR UPDATE OF "deletionRequestedAt" ON "User" FOR EACH ROW EXECUTE FUNCTION floresia_admin_notification();
CREATE TRIGGER floresia_order_admin_notification AFTER UPDATE OF status ON "Order" FOR EACH ROW EXECUTE FUNCTION floresia_admin_notification();
CREATE TRIGGER floresia_comment_admin_notification AFTER INSERT ON "Comment" FOR EACH ROW EXECUTE FUNCTION floresia_admin_notification();
CREATE TRIGGER floresia_review_admin_notification AFTER INSERT ON "Testimonial" FOR EACH ROW EXECUTE FUNCTION floresia_admin_notification();
