# ademkinatas.github.io

Mobil oyunların ortak, ücretsiz sayfaları: gizlilik politikası, kullanım şartları, destek, hesap silme ve tek `app-ads.txt`. GitHub Pages ile `https://ademkinatas.github.io` adresinde yayınlanır.

| Oyun | Adres | Sayfaların kaynağı |
|---|---|---|
| Bzzt! | `/bzzt/` | `Taboo/docs/bzzt-src` |
| Üç Âlem | `/uc-alem/` | `Mitolojik-Satranc/site` |
| Takama | `/takama/` | `tas-kagit-makas/site` |
| Selfie Dice | `/selfie-dice/` | `zar-atma/website` |
| Dayak Defteri | `/dayak-defteri/` | `cop-adam-fight/tools/site` |
| Gece Baskısı | `/gece-baskisi/` | `Vampir-Koylu/client/src/lib/legal.ts` |

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

- `developer`, `email`: Ana sayfada ve Gece Baskısı'nın sayfalarında görünür.
- `admobPublisherId`: AdMob hesabındaki `pub-…` kimliği. Tek satır, bütün oyunları kapsar. AdMob'da her uygulamanın geliştirici web sitesi olarak `https://ademkinatas.github.io` girilir.
- Yeni oyun eklemek için `games` listesine bir kayıt ekle.

## Mağazalara girilecek adresler

| Alan | Değer |
|---|---|
| Gizlilik politikası | `https://ademkinatas.github.io/<oyun>/` + `links.privacy` |
| Destek | `https://ademkinatas.github.io/<oyun>/` + `links.support` |
| Geliştirici web sitesi (AdMob, Play) | `https://ademkinatas.github.io` |
