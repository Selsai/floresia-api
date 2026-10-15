-- Complément demandé : ajout de photos et retrait de publications.
CREATE FUNCTION floresia_publication_activity_notification() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  publication RECORD;
  event_title TEXT;
  event_id TEXT;
  actor_name TEXT;
  actor_email TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN publication := OLD; ELSE publication := NEW; END IF;
  IF publication."authorId" IS NOT NULL THEN
    SELECT "firstName" || ' ' || "lastName", email INTO actor_name, actor_email
    FROM "User" WHERE id = publication."authorId"
      AND "deletionRequestedAt" IS NULL AND "accountErasedAt" IS NULL;
    -- Le nettoyage d'un compte désactivé ne génère pas une rafale d'alertes.
    IF NOT FOUND THEN RETURN publication; END IF;
  END IF;
  IF TG_TABLE_NAME = 'GalleryPhoto' THEN
    event_title := CASE WHEN TG_OP = 'INSERT' THEN 'Nouvelle photo partagée' ELSE 'Photo supprimée' END;
  ELSIF TG_TABLE_NAME = 'Comment' THEN
    event_title := 'Commentaire supprimé';
  ELSE
    event_title := 'Avis supprimé';
  END IF;
  event_id := TG_TABLE_NAME || '/' || lower(TG_OP) || '/' || publication.id;
  INSERT INTO "AdminNotification" (id, title, payload)
    VALUES (event_id, event_title, jsonb_build_object('name', actor_name, 'email', actor_email, 'reference', publication.id))
    ON CONFLICT (id) DO NOTHING;
  -- Aucun contenu supprimé, fichier photo ou URL personnelle n'est recopié.
  RETURN publication;
END;
$$;
CREATE TRIGGER floresia_photo_activity_notification AFTER INSERT OR DELETE ON "GalleryPhoto" FOR EACH ROW EXECUTE FUNCTION floresia_publication_activity_notification();
CREATE TRIGGER floresia_comment_deleted_notification AFTER DELETE ON "Comment" FOR EACH ROW EXECUTE FUNCTION floresia_publication_activity_notification();
CREATE TRIGGER floresia_review_deleted_notification AFTER DELETE ON "Testimonial" FOR EACH ROW EXECUTE FUNCTION floresia_publication_activity_notification();
