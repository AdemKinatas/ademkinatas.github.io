# ademkinatas.github.io

Mobil oyunların ortak, ücretsiz sayfaları: gizlilik politikası, kullanım şartları, destek, hesap silme ve tek `app-ads.txt`. Herkese açık adres `https://ademkinatas.com`; site doğrudan Cloudflare'dan (Workers Static Assets, `edge/`) sunulur. GitHub yalnızca kaynak yedeğidir; GitHub Pages artık origin değildir.

| Oyun | Adres | Sayfaların kaynağı |
|---|---|---|
| Bzzt! | `/bzzt/` | `bzzt/docs/bzzt-src` |
| Mythmate | `/mythmate/` | `Mitolojik-Satranc/site` |
| Taş Kağıt Tokat | `/tas-kagit-makas/` | `tas-kagit-makas/site` |
| Zar Atma | `/zar-atma/` | `zar-atma/site` |
| Doodle KO | `/doodle-knockout/` | `doodle-knockout/tools/site` |
| Sabaha Kim Kalır? | `/sabaha-kim-kalir/` | `sabaha-kim-kalir/client/src/lib/legal.ts` |

## Nasıl çalışır

Her oyunun metni kendi projesinde yazılır ve orada üretilir. Bu depo metin yazmaz:

1. Oyunun projesinde siteyi üret (komut `studio.json` içinde, `build`).
2. Burada çalıştır:

   ```sh
   node scripts/sync.mjs
   ```

   Her oyunun son derlemesini `/<oyun>/` altına kopyalar, kök bağlantıları bu klasöre taşır, `index.html` ve `app-ads.txt` dosyalarını yeniden yazar.
3. Cloudflare'a yayınla (saniyeler içinde canlı olur, `ademkinatas.com` hemen güncellenir):

   ```sh
   npm run deploy      # = cd edge && npx wrangler deploy
   ```

   (`npm run release` sync + deploy'u birlikte çalıştırır.)
4. Değişikliği commit edip push et (GitHub kaynak yedeği).

## Barındırma (hosting)

- `ademkinatas.com` bir Cloudflare Worker'dır (`edge/`, ad `ademkinatas-site`, özel alan adı `ademkinatas.com`). Depo kökü Workers Static Assets olarak yüklenir; `.assetsignore` sayfa olmayan dosyaları (`edge/`, `scripts/`, `README.md`, `studio.json`, `LICENSE`, noktalı dosyalar) dışarıda tutar.
- `edge/src/index.js` yalnızca URL kurallarını uygular, GitHub Pages ile aynı: `/dizin/` -> `dizin/index.html`, `/dizin` -> 301 ile `/dizin/`, `/sayfa` -> `sayfa.html`, bulunamayan her şey `404.html` ile 404. `app-ads.txt` kökte doğrudan 200 döner. `/robots.txt`'i Cloudflare'ın yönetilen robots.txt'i karşılar.
- Geri alma: `cd edge && npx wrangler rollback <sürüm-id>` (sürümler: `npx wrangler versions list`).
- Çıkış öncesi sürüm (GitHub origin'ini proxy'leyen Worker): `f6853494-07ee-4771-a03e-aa084098bdb6`.
- `ademkinatas.github.io` adresi hâlâ GitHub Pages'te açıktır; eski bağlantılar için o ayar kapatılana kadar çalışır, ama `ademkinatas.com` artık ona bağlı değildir.

**Bir oyun ancak sayfaları eksiksizse yayına girer.** Şunlardan biri kalırsa o oyun dışarıda tutulur ve ana sayfada "Yakında" görünür:
- `[EMAIL]`, `[controller.name]` gibi doldurulmamış alanlar ve `TODO`
- yerel sunucu adresi (`127.0.0.1`, `localhost`)
- oyunun alınmamış alan adıyla verilen adresler (ör. `support@playtakama.com`)
- kırık bağlantı

Eksikleri yerinde görmek için `node scripts/sync.mjs --drafts` çalıştır. Bu kopyaları **push etme**.

## Ortak ayarlar (`studio.json`)

- `site`: herkese açık adres (`https://ademkinatas.com`). Bir oyunun `domain` alanındaki adresler `<site>/<oyun>` adresine çevrilir; 404 sayfası da ana sayfaya buradan bağlanır. 
- `developer`, `email`: Ana sayfada ve Sabaha Kim Kalır?'ın sayfalarında görünür.
- `admobPublisherId`: AdMob hesabındaki `pub-…` kimliği. Tek satır, bütün oyunları kapsar. AdMob'da her uygulamanın geliştirici web sitesi olarak `https://ademkinatas.com` girilir.
- Yeni oyun eklemek için `games` listesine bir kayıt ekle.

## Mağazalara girilecek adresler

| Alan | Değer |
|---|---|
| Gizlilik politikası | `https://ademkinatas.com/<oyun>/` + `links.privacy` |
| Destek | `https://ademkinatas.com/<oyun>/` + `links.support` |
| Geliştirici web sitesi (AdMob, Play) | `https://ademkinatas.com` |
