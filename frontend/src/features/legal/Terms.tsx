import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/brand";
import { TextSection, TextSections, textLinkCls } from "@/ui/PageShell";
import { ContactLine } from "./ContactLine";
import { LEGAL_UPDATED } from "./PrivacyPolicy";

export function Terms() {
  return (
    <TextSections updated={LEGAL_UPDATED}>
      <TextSection title="Le service">
        <p>
          {PRODUCT_NAME} met en relation des développeurs qui ont une application à faire tester avec des professionnels
          vérifiés du métier visé. Le développeur décrit son application et un parcours de test ; les testeurs le
          suivent, envoient leurs preuves et leur avis, puis sont rémunérés après validation. En créant un compte, tu
          acceptes ces conditions.
        </p>
      </TextSection>

      <TextSection title="Comptes et rôles">
        <ul>
          <li>Chaque compte a un rôle : développeur ou testeur. Un compte appartient à une seule personne.</li>
          <li>Tu donnes des informations exactes et tu gardes ton mot de passe pour toi.</li>
          <li>
            La connexion avec Google sert uniquement à t&apos;identifier, comme le décrit la{" "}
            <Link href="/confidentialite" className={textLinkCls}>
              politique de confidentialité
            </Link>
            .
          </li>
        </ul>
      </TextSection>

      <TextSection title="Engagements du développeur">
        <ul>
          <li>Tu ne proposes que des applications que tu as le droit de faire tester.</li>
          <li>Ton application et ton parcours de test sont licites et ne piègent pas les testeurs.</li>
          <li>Tu utilises les réponses des testeurs pour améliorer ton application, sans les rendre publiques.</li>
          <li>Tu notes les testeurs de bonne foi.</li>
        </ul>
      </TextSection>

      <TextSection title="Engagements du testeur">
        <ul>
          <li>Tu prouves ton vrai métier ; une fausse preuve entraîne la fermeture du compte.</li>
          <li>
            Avant chaque test, tu acceptes un accord de confidentialité : tu ne partages ni l&apos;application, ni ses
            captures, ni ce que tu y découvres.
          </li>
          <li>Tes réponses, captures et avis sont honnêtes et viennent de ton propre test.</li>
        </ul>
      </TextSection>

      <TextSection title="Notation">
        <p>
          Après un test, le développeur et le testeur se notent de 1 à 5. La note moyenne d&apos;un testeur aide les
          développeurs à le choisir. Une note doit refléter le test, jamais servir à nuire.
        </p>
      </TextSection>

      <TextSection title="Paiements">
        <p>
          Le testeur est rémunéré après validation de son test par le développeur. Pendant la démo CADEV 2026, tous les
          paiements et retraits sont simulés : aucun argent réel ne circule.
        </p>
      </TextSection>

      <TextSection title="Contenus interdits">
        <p>Sur {PRODUCT_NAME}, il est interdit de publier ou de faire tester :</p>
        <ul>
          <li>
            tout contenu intime ou sexuel montrant une personne sans son accord, y compris un contenu généré ou modifié
            par IA ;
          </li>
          <li>tout contenu qui concerne des mineurs de façon sexuelle, violente ou dangereuse ;</li>
          <li>du harcèlement, de la haine, des menaces ou de l&apos;usurpation d&apos;identité ;</li>
          <li>des logiciels malveillants, de l&apos;hameçonnage ou toute activité illégale.</li>
        </ul>
        <p>Un tel contenu est retiré et le compte concerné fermé, sans préavis.</p>
      </TextSection>

      <TextSection title="Responsabilité">
        <p>
          Chaque développeur reste responsable de son application et chaque testeur de ses réponses. {PRODUCT_NAME}{" "}
          fournit la mise en relation et les outils du test ; le service est proposé tel quel pendant la démo, sans
          garantie de disponibilité continue.
        </p>
      </TextSection>

      <TextSection title="Suspension">
        <p>
          En cas de non-respect de ces conditions, {PRODUCT_NAME} peut suspendre ou fermer un compte. Tu peux aussi
          fermer le tien à tout moment en nous écrivant.
        </p>
      </TextSection>

      <TextSection title="Contact">
        <p>
          Pour toute question sur ces conditions, <ContactLine />.
        </p>
      </TextSection>
    </TextSections>
  );
}
