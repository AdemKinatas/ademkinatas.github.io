# ademkinatas.github.io

Mobil oyunların ortak, ücretsiz sayfaları: gizlilik politikası, kullanım şartları, destek, hesap silme ve tek `app-ads.txt`. Herkese açık adres `https://ademkinatas.com`; GitHub Pages (`https://ademkinatas.github.io`) yalnızca kaynak (origin), `ademkinatas.com` ona bir Cloudflare Worker (`edge/`) üzerinden bağlanır.

| Oyun | Adres | Sayfaların kaynağı |
|---|---|---|
| Bzzt! | `/bzzt/` | `bzzt/docs/bzzt-src` |
| Mythmate | `/mythmate/` | `Mitolojik-Satranc/site` |
| Taş Kağıt Tokat | `/tas-kagit-makas/` | `tas-kagit-makas/site` |
| Zar Atma | `/zar-atma/` | `zar-atma/site` |
| Doodle KO | `/doodle-knockout/` | `cop-adam-fight/tools/site` |
| Sabaha Kim Kalır? | `/sabaha-kim-kalir/` | `Vampir-Koylu/client/src/lib/legal.ts` |

## Nasıl çalışır

Her oyunun metni kendi projesinde yazılır ve orada üretilir. Bu depo metin yazmaz:

1. Oyunun projesinde siteyi üret (komut `studio.json` içinde, `build`).
2. Burada çalıştır:

   ```sh
   node scripts/sync.mjs
   ```

   Her oyunun son derlemesini `/<oyun>/` altına kopyalar, kök bağlantıları bu klasöre taşır, `index.html` ve `app-ads.txt` dosyalarını yeniden yazar.
3. Değişikliği commit edip push et. GitHub Pages birkaç dakikada yayınlar.

**Bir oyun ancak sayfaları eksiksizse yayına girer.** Şunlardan biri kalırsa o oyun dışarıda tutulur ve ana sayfada "Yakında" görünür:
- `[EMAIL]`, `[controller.name]` gibi doldurulmamış alanlar ve `TODO`
- yerel sunucu adresi (`127.0.0.1`, `localhost`)
- oyunun alınmamış alan adıyla verilen adresler (ör. `support@playtakama.com`)
- kırık bağlantı

Eksikleri yerinde görmek için `node scripts/sync.mjs --drafts` çalıştır. Bu kopyaları **push etme**.

## Ortak ayarlar (`studio.json`)

- `site`: herkese açık adres (`https://ademkinatas.com`). Bir oyunun `domain` alanındaki adresler `<site>/<oyun>` adresine çevrilir; 404 sayfası da ana sayfaya buradan bağlanır. GitHub Pages kaynağı (`edge/src/index.js` içindeki `ORIGIN`) bundan bağımsızdır.
- `developer`, `email`: Ana sayfada ve Sabaha Kim Kalır?'ın sayfalarında görünür.
- `admobPublisherId`: AdMob hesabındaki `pub-…` kimliği. Tek satır, bütün oyunları kapsar. AdMob'da her uygulamanın geliştirici web sitesi olarak `https://ademkinatas.com` girilir.
- Yeni oyun eklemek için `games` listesine bir kayıt ekle.

## Mağazalara girilecek adresler

| Alan | Değer |
|---|---|
| Gizlilik politikası | `https://ademkinatas.com/<oyun>/` + `links.privacy` |
| Destek | `https://ademkinatas.com/<oyun>/` + `links.support` |
| Geliştirici web sitesi (AdMob, Play) | `https://ademkinatas.com` |
