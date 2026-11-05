import { PRODUCT_NAME } from "@/lib/brand";
import { TextSection, TextSections, textLinkCls } from "@/ui/PageShell";
import { ContactLine } from "./ContactLine";

export const LEGAL_UPDATED = "5 novembre 2026";
const GOOGLE_POLICY = "https://developers.google.com/terms/api-services-user-data-policy";

export function PrivacyPolicy() {
  return (
    <TextSections updated={LEGAL_UPDATED}>
      <TextSection title="Qui est responsable">
        <p>
          {PRODUCT_NAME} est une plateforme qui met en relation des développeurs qui ont une application à faire tester
          avec des professionnels vérifiés du métier visé. Elle est éditée par l&apos;équipe {PRODUCT_NAME}, basée à
          Abidjan, responsable des données décrites ici.
        </p>
        <p>
          Pour toute question sur tes données, <ContactLine />.
        </p>
      </TextSection>

      <TextSection title="Ce que nous collectons">
        <p>
          <strong>Pour tous les comptes</strong>
        </p>
        <ul>
          <li>ton prénom, ton adresse e-mail et ton rôle (développeur ou testeur) ;</li>
          <li>ton mot de passe, enregistré uniquement sous forme chiffrée (si tu ne passes pas par Google).</li>
        </ul>
        <p>
          <strong>Si tu es développeur</strong>
        </p>
        <ul>
          <li>le nom, l&apos;adresse, la description et les captures de ton application ;</li>
          <li>tes campagnes de test : métier visé, nombre de testeurs, étapes du parcours ;</li>
          <li>les notes et commentaires que tu laisses aux testeurs.</li>
        </ul>
        <p>
          <strong>Si tu es testeur</strong>
        </p>
        <ul>
          <li>ton métier, ton entreprise et ta ville ;</li>
          <li>ton profil LinkedIn ou un document qui prouve ton métier ;</li>
          <li>ton numéro mobile money, pour te rémunérer ;</li>
          <li>la date de ton accord au moment de l&apos;inscription ;</li>
          <li>
            pendant un test : tes réponses, tes captures d&apos;écran, ton avis et ton accord de confidentialité ;
          </li>
          <li>ta note moyenne, tes gains et tes demandes de retrait.</li>
        </ul>
        <p>
          <strong>Pour les personnes qui utilisent une application testée</strong>
        </p>
        <p>
          Le développeur peut installer le script de suivi {PRODUCT_NAME} sur son application. À chaque page vue, ce
          script envoie seulement l&apos;adresse de la page et le projet concerné, avec la date. Si tu es arrivé par un
          lien de test {PRODUCT_NAME}, il garde le jeton de ce lien dans le stockage local de ton navigateur pour
          rattacher tes visites suivantes à ton test. Il ne pose aucun cookie, ne lit ni ton nom ni ce que tu saisis.
          Ton adresse IP n&apos;est pas enregistrée avec tes visites. Le serveur la garde seulement dans ses journaux
          techniques, pour une courte durée, afin d&apos;assurer la sécurité du site et de limiter les abus.
        </p>
      </TextSection>

      <TextSection title="Connexion avec Google">
        <p>
          Tu peux te connecter avec ton compte Google. {PRODUCT_NAME} ne demande alors que ton nom, ton adresse e-mail
          et l&apos;identifiant de ton compte (autorisations «&nbsp;openid&nbsp;», «&nbsp;email&nbsp;» et
          «&nbsp;profile&nbsp;»), uniquement pour créer ton compte et te connecter. Nous n&apos;en gardons que ton
          adresse e-mail et ton prénom.
        </p>
        <ul>
          <li>
            {PRODUCT_NAME} n&apos;a aucun autre accès à ton compte Google : ni Gmail, ni Drive, ni contacts, ni photos.
          </li>
          <li>
            Ces informations ne sont jamais vendues, jamais partagées à des fins publicitaires et jamais utilisées pour
            entraîner un modèle d&apos;IA.
          </li>
          <li>Elles ne sont pas transmises aux services d&apos;IA décrits plus bas.</li>
        </ul>
        <p>
          L&apos;utilisation des informations reçues des API Google respecte les{" "}
          <a href={GOOGLE_POLICY} className={textLinkCls} rel="noopener noreferrer" target="_blank">
            Règles relatives aux données utilisateur des services d&apos;API Google
          </a>
          , y compris les exigences d&apos;utilisation limitée.
        </p>
      </TextSection>

      <TextSection title="Pourquoi">
        <ul>
          <li>
            <strong>Vérifier les métiers</strong> : ta preuve de métier sert à t&apos;attribuer un badge vérifié avant
            de te proposer des tests.
          </li>
          <li>
            <strong>Faire tourner les tests</strong> : inviter les testeurs, suivre le parcours, transmettre les
            réponses et les avis au développeur, noter chaque côté.
          </li>
          <li>
            <strong>Rémunérer</strong> : calculer tes gains et les verser sur ton numéro mobile money.
          </li>
          <li>
            <strong>Mesurer l&apos;adoption</strong> : montrer au développeur quels testeurs reviennent sur son
            application à J1, J7 et J30.
          </li>
        </ul>
        <p>
          Ces traitements reposent sur ton inscription et l&apos;utilisation du service. L&apos;envoi d&apos;une preuve
          de métier se fait avec ton accord explicite, donné à l&apos;inscription comme testeur.
        </p>
      </TextSection>

      <TextSection title="Recommandation par IA">
        <p>
          Pour aider un développeur à choisir ses testeurs, {PRODUCT_NAME} peut demander un classement à Groq, puis à
          Mistral si Groq ne répond pas. Ce qui leur est envoyé :
        </p>
        <ul>
          <li>le nom, la description et l&apos;adresse de l&apos;application, le texte de sa page publique ;</li>
          <li>le métier visé et les étapes du test ;</li>
          <li>
            pour chaque testeur possible : un numéro interne, son métier, sa ville, sa note moyenne et son nombre de
            tests validés.
          </li>
        </ul>
        <p>
          Ni ton nom, ni ton adresse e-mail, ni ton téléphone, ni tes documents, ni rien de ce qui vient de Google ne
          leur est envoyé. Sans ces services, le classement se fait par des règles simples (métier, note, tests
          validés). {PRODUCT_NAME} ne génère et ne modifie aucune image.
        </p>
      </TextSection>

      <TextSection title="Qui voit tes données">
        <p>
          Dans {PRODUCT_NAME}, un développeur voit des testeurs de son projet le prénom, le métier, la ville, la note et
          les réponses au test. Il ne voit ni ton adresse e-mail, ni ton numéro, ni ta preuve de métier.
        </p>
        <p>Hors de {PRODUCT_NAME}, nous ne faisons appel qu&apos;à des prestataires techniques :</p>
        <ul>
          <li>Systalink (Datacloud) pour l&apos;hébergement de la base de données ;</li>
          <li>le serveur qui fait tourner l&apos;application ;</li>
          <li>Groq et Mistral pour la recommandation décrite plus haut ;</li>
          <li>Google pour la connexion, si tu la choisis.</li>
        </ul>
        <p>
          Rien n&apos;est revendu. Pour l&apos;instant, les paiements sont simulés : aucun prestataire de paiement ne
          reçoit tes données.
        </p>
      </TextSection>

      <TextSection title="Conservation et sécurité">
        <ul>
          <li>
            Tes données sont gardées tant que ton compte existe. Pour supprimer ton compte, fais-en la demande (voir
            plus bas). Les traces de paiement (gains, retraits et numéro mobile money utilisé) peuvent être conservées
            après la suppression, pour le suivi comptable et en cas de litige.
          </li>
          <li>
            Les documents de preuve et les captures ne sont jamais publics : ils passent uniquement par des accès
            réservés aux personnes concernées et à l&apos;équipe de vérification.
          </li>
          <li>Les échanges avec le site sont chiffrés et les mots de passe ne sont jamais stockés en clair.</li>
        </ul>
      </TextSection>

      <TextSection title="Tes droits">
        <p>
          Tu peux à tout moment demander à consulter, corriger ou supprimer tes données, ou retirer ton accord. Pour
          cela, <ContactLine />. Nous répondons dans un délai d&apos;un mois au plus.
        </p>
        <p>
          Tu peux aussi saisir l&apos;ARTCI, l&apos;autorité ivoirienne chargée de la protection des données
          personnelles, si tu estimes que tes droits ne sont pas respectés.
        </p>
      </TextSection>
    </TextSections>
  );
}
