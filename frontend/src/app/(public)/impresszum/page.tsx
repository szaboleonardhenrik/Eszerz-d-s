import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impresszum – SzerződésPortál",
  description:
    "SzerződésPortál impresszum – szolgáltató adatai, tárhelyszolgáltató, szerzői jogok és felelősségkizárás.",
};

export default function ImpresszumPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Impresszum</h1>
      <p className="text-sm text-gray-400 mb-10">Hatályos: 2026. március 1.</p>

      <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-brand-teal-dark">
        <h2>1. Szolgáltató adatai</h2>
        <ul>
          <li><strong>Név:</strong> Szabó Leonárd Henrik egyéni vállalkozó</li>
          <li><strong>Székhely:</strong> Magyarország (pontos cím a nyilvántartásban)</li>
          <li><strong>Adószám:</strong> [adószám helye]</li>
          <li><strong>Nyilvántartási szám:</strong> [nyilvántartási szám helye]</li>
          <li><strong>Email:</strong> hello@szerzodes.cegverzum.hu</li>
          <li><strong>Weboldal:</strong> <a href="https://szerzodes.cegverzum.hu">https://szerzodes.cegverzum.hu</a></li>
        </ul>

        <h2>2. Tárhelyszolgáltató</h2>
        <ul>
          <li><strong>Név:</strong> Hetzner Online GmbH</li>
          <li><strong>Székhely:</strong> Industriestr. 25, 91710 Gunzenhausen, Németország</li>
          <li><strong>Weboldal:</strong> <a href="https://www.hetzner.com">https://www.hetzner.com</a></li>
          <li><strong>Email:</strong> info@hetzner.com</li>
        </ul>

        <h2>3. Felelős személy</h2>
        <ul>
          <li><strong>A weboldal tartalmáért felelős személy:</strong> Szabó Leonárd Henrik</li>
          <li><strong>Kapcsolat:</strong> hello@szerzodes.cegverzum.hu</li>
        </ul>

        <h2>4. Szerzői jogok</h2>
        <p>
          A szerzodes.cegverzum.hu weboldal és annak tartalma (szövegek, grafikai elemek, logók,
          szoftver) szerzői jogi védelem alatt áll. A tartalom másolása, terjesztése vagy
          felhasználása kizárólag a szolgáltató előzetes írásbeli engedélyével lehetséges.
        </p>

        <h2>5. Felelősségkizárás</h2>
        <p>
          A platform nem nyújt jogi tanácsadást. A szerződéssablonok tájékoztató jellegűek, és nem
          helyettesítik a szakszerű jogi véleményt. A szolgáltató nem vállal felelősséget a sablonok
          jogi megfelelőségéért az adott felhasználási kontextusban.
        </p>
        <p>
          A platformon elérhető elektronikus aláírás egyszerű elektronikus aláírásnak (SES) minősül
          az eIDAS rendelet (EU 910/2014) értelmében. Bizonyos szerződéstípusokhoz (pl. ingatlan,
          hitel) minősített elektronikus aláírás (QES) szükséges.
        </p>

        <h2>6. Vitarendezés</h2>
        <p>
          Az Európai Bizottság online vitarendezési platformja:{" "}
          <a href="https://ec.europa.eu/consumers/odr">https://ec.europa.eu/consumers/odr</a>
        </p>
        <p>A szolgáltatóra vonatkozó fogyasztóvédelmi hatóság:</p>
        <ul>
          <li><strong>Nemzeti Fogyasztóvédelmi Hatóság (NFH)</strong></li>
          <li><strong>Weboldal:</strong> <a href="https://fogyasztovedelem.kormany.hu">https://fogyasztovedelem.kormany.hu</a></li>
        </ul>

        <h2>7. Alkalmazandó jog</h2>
        <p>
          A weboldalra és annak használatára a magyar jog az irányadó.
        </p>

        <hr />
        <p className="text-sm text-gray-400">
          Utolsó módosítás: 2026. március 1. | SzerződésPortál &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
