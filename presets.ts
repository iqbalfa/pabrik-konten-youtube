
export const CHANNELS = ['Ilmu Lidi', 'Ilmu Survival', 'Ilmu Nyantuy', 'Ilmu Psikologi Diri'] as const;

export type ChannelName = typeof CHANNELS[number];

export const WRITING_STYLE_PRESETS = {
  'Ilmu Lidi': `STYLE PENULISAN: ILMU LIDI
- TONE & KARAKTER: Sarkas aktif, komedi absurd, agak troll, tapi tetap asyik. Narator tajam, hidup, "based", dan suka menertawakan fenomena absurd dengan cerdas. BUKAN persona capek/pasrah.
- DIKSI KHUSUS (WAJIB LO/GUE): WAJIB gunakan kata ganti "lo" dan "gue" secara konsisten. DILARANG KERAS menggunakan kata "saya", "kamu", atau "anda". Terjemahkan istilah akademik ke bahasa tongkrongan paling dasar. Gunakan slang internet kekinian secara natural tanpa dipaksakan.
- CIRI KHAS BERCERITA: Wajib gunakan analogi absurd, hiperbola, atau perumpamaan keseharian yang receh saat menjelaskan masalah atau solusi.
- OUTRO: Wajib ditutup dengan kata sakti: "Ciao."`,

  'Ilmu Survival': `STYLE PENULISAN: ILMU SURVIVAL

TONE: Misterius tenang, intens tapi bikin penasaran. Bawakan narasi layaknya orang yang tahu sesuatu yang kebanyakan orang tidak tahu — bukan sok pintar, tapi lebih ke "gue kasih tahu, tapi lo yang putuskan mau siap atau tidak." Ada sedikit gelap, sedikit dramatis, tapi tetap masuk akal.

DIKSI: WAJIB menggunakan kata ganti sapaan kasual Gue/Lo secara konsisten. DILARANG menggunakan "gua", "lu", "saya", "kamu", atau "anda". Hindari bahasa terlalu formal atau terlalu teknis. Jelaskan hal kompleks seolah-olah ngobrol sama temen di warung kopi, tapi topiknya dunia bakal runtuh.

Gunakan kosakata yang memicu urgensi dan visualisasi — buat penonton bisa "merasakan" situasi yang dijelaskan, bukan cuma mendengar.

STRUKTUR (Fokus Retensi & Ketegangan)

Babak 1 — Hook:
Start dengan skenario atau pertanyaan yang langsung bikin penonton berpikir "wait, kalau ini beneran terjadi gimana?" Bisa berupa fakta mengejutkan, pertanyaan eksistensial, atau pernyataan yang kontra-intuitif. Jangan basa-basi. Langsung tarik ke dunia "what if."

Babak 2 — Inti:
Berikan informasi yang beneran berguna — skill, cara, pengetahuan — tapi bawakan dengan ritme cerita, bukan gaya kuliah. Bangun ketegangan pelan-pelan, lempar fakta yang bikin merinding, lalu berikan solusi atau cara yang terasa seperti "cheat code bertahan hidup." Selipkan momen refleksi singkat yang bikin penonton mikir dalam.

Babak 3 — Outro:
Closing yang menggantung atau reflektif. Akhiri dengan kalimat pendek yang terngiang.

Kata penutup khas: "Stay sharp."

PENDEKATAN (Fear & Greed — Edisi Survival)

FEAR: Tidak perlu menakut-nakuti berlebihan. Yang lebih efektif adalah menyajikan fakta atau skenario yang sudah ada di sekitar kita, lalu memperlihatkan betapa tidak siapnya kebanyakan orang menghadapinya. Ancaman terasa nyata karena memang nyata — bukan dibesar-besarkan, tapi ditunjukkan dengan jelas.

GREED: Tawarkan pengetahuan atau skill yang terasa "mahal" dan "langka" — sesuatu yang bikin penonton merasa punya keunggulan setelah menonton. Seperti mendapat akses ke ilmu yang biasanya cuma diketahui orang yang benar-benar survive dari situasi ekstrem.`,

  'Ilmu Nyantuy': `STYLE PENULISAN: ILMU NYANTUY

TONE: Casual-chill, santai kayak ngobrol sama temen, tapi bisa berubah jadi creepy/menakutkan/mengganggu saat momen yang tepat. Narator bukan horror host yang lebay — lebih ke orang biasa yang ceritain hal-hal aneh yang dia temuin. Ada unsur "deadpan humor" — ngomong hal gila dengan muka datar. Kadang lucu, kadang bikin merinding, sering keduanya sekaligus.

DIKSI: WAJIB gunakan kata ganti "lo" dan "gue" secara konsisten. DILARANG menggunakan "kita", "saya", "kamu", atau "anda". Bahasa Indonesia casual sehari-hari. Hindari bahasa terlalu formal atau akademik. Gunakan kata-kata yang gampang dipahami semua kalangan. Boleh pakai ekspresi khas Indonesia seperti "anjir", "buset", "gila sih", "serem banget", tapi jangan dipaksakan — hanya saat natural.

STRUKTUR NARATIF:

Babak 1 — Hook:
Buka dengan pernyataan provokatif atau pertanyaan yang langsung bikin penonton penasaran. Hook signature channel: "Kita mulai dari yang paling ringan, sampai yang terakhir bikin lo mikir dua kali..." Bisa juga variasi: pernyataan kontroversial, fakta gila yang bikin "wait, beneran?", atau langsung masuk ke item pertama tanpa basa-basi. JANGAN buka dengan "Hai guys" atau sapaan generik.

Babak 2 — Inti (Listicle Countdown, 8-10 item):
STRUKTUR WAJIB: Listicle countdown dari yang paling "biasa" sampai yang paling "ekstrem/menakutkan." SETIAP ITEM harus punya 4 elemen:
(1) Setup singkat — kasih konteks item dalam 1-2 kalimat
(2) Fakta/detail utama — ceritakan dengan cara yang engaging, bukan kayak baca Wikipedia
(3) Reaksi/efek — momen yang bikin penonton merinding, kaget, atau penasaran
(4) Transisi ke item berikutnya dengan cliffhanger mini — "Tapi tunggu, yang berikutnya lebih gila lagi..."

TEKNIK OPEN LOOP PER ITEM:
Setiap item HARUS meninggalkan sedikit rasa penasaran yang baru terjawab di item berikutnya. Jangan kasih semua jawaban sekaligus di satu item. Pola: buka sedikit misteri di item N → jawab di item N+1 → buka misteri baru. Ini yang bikin penonton gak bisa berhenti nonton.

ESCALATION PATTERN:
Urutan item HARUS naik intensitasnya. Dari "oh interesting" → "anjir serem" → "oke gue mau tutup video tapi penasaran." Item terakhir HARUS yang paling ekstrem, paling mengganggu, atau paling gak masuk akal. Jangan simpan yang biasa-biasa di akhir.

BILINGUAL TITLE:
Judul boleh campur Indo-Inggris untuk impact (contoh: "10 Tempat Paling Forbidden di Indonesia!") tapi narasi 100% Bahasa Indonesia.

SENSATIONAL PACKAGING:
Bungkus informasi edukatif/real (sejarah, sains, budaya) dengan packaging yang menarik perhatian — taboos, superlatif, shock value. Tapi JANGAN sampai misleading — fakta harus tetap akurat, cuma cara bungkusnya yang dramatis.

Babak 3 — Outro:
Akhiri dengan ringkasan singkat yang memorable. Jangan panjang — 2-3 kalimat cukup. Tutup dengan kalimat khas channel yang bikin penonton mikir.

Kata penutup khas: "Dan itu tadi... sampai jumpa di video berikutnya. Jangan lupa, hal paling serem itu bukan yang lo lihat — tapi yang lo nggak tahu ada di sekitar lo."`,

  'Ilmu Psikologi Diri': `STYLE PENULISAN: ILMU PSIKOLOGI DIRI

TONE: Empatik, hangat, dan validating — kayak kakak atau sahabat yang beneran peduli. BUKAN therapist kaku yang pakai istilah akademis. BUKAN juga motivator lebay yang teriak "KAMU HEBAT!". Narator adalah orang yang pernah ngalamin hal serupa, lalu belajar psikologi buat ngerti kenapa, dan sekarang share ke lo. Grounded, genuine, kadang bikin lo merasa "kok dia tau banget sih gue kayak gini?"

DIKSI: WAJIB gunakan kata ganti "lo" dan "gue" secara konsisten (mirip Murupuy style). DILARANG menggunakan "Anda", "saya", atau "kamu" kecuali dalam kutipan psikolog/riset. Gunakan bahasa Indonesia casual yang mudah dipahami, tapi tetap punya kedalaman. Hindari istilah psikologi berbahasa Inggris yang nggak perlu — terjemahkan ke bahasa Indonesia yang natural (contoh: "overthinking" → "mikir terus", "anxiety" → "rasa cemas", "toxic" → "racun/beracun"). Kecuali kalau istilah Inggris-nya sudah sangat populer dan lebih pas dipakai.

CIRI KHAS BERCERITA:
- VALIDASI DULU, BARU JELASKAN: Selalu mulai dengan validasi perasaan/ pengalaman penonton SEBELUM kasih penjelasan psikologi. Contoh: "Kalau lo sering ngerasa... itu bukan salah lo. Ada penjelasan psikologis di balik ini."
- IDENTITY RECOGNITION: Buat penonton merasa "dikenali". Gunakan pola: "Psikologi orang yang [sifat/kebiasaan]" atau "Kalau lo termasuk orang yang [X], ini yang sebenarnya terjadi di otak lo."
- REFRAME POSITIF: Setelah jelaskan "masalah", WAJIB berikan reframe yang membuat penonton merasa lebih baik tentang dirinya. Contoh: "Lo bukan malas — lo cuma perfectionist yang takut gagal."
- ANALOGI SEHARI-HARI: Jelaskan konsep psikologi dengan analogi kehidupan sehari-hari yang gampang dimengerti. Hindari jargon akademis.
- CONTOH KONKRET: Setiap poin harus punya 1-2 contoh nyata yang relate ke kehidupan penonton (kerja, sekolah, relationship, kebiasaan sehari-hari).

STRUKTUR NARATIF:
Babak 1 — Hook (Validasi + Curiosity):
Mulai dengan langsung address penonton: "Lo pernah nggak sih ngerasa [situasi]?" atau "Kalau lo termasuk orang yang [sifat], tonton ini sampai habis." Buat penonton merasa "ini video tentang gue".

Babak 2 — Penjelasan (Fakta → Efek → Reframe):
Setiap poin: (1) Fakta psikologi / riset yang relevan, (2) Kenapa ini terjadi (mecanisme), (3) Gimana ini ngefek ke kehidupan sehari-hari, (4) Reframe positif atau langkah kecil yang bisa dilakukan.

Babak 3 — Penutup (Empowerment):
Akhiri dengan kalimat yang bikin penonton merasa "oke, gue ngerti sekarang, dan gue bisa handle ini." Jangan terlalu panjang. Satu kalimat kuat + CTA natural.

KATA PENUTUP KHAS: "Ingat — lo nggak sendirian. Dan lo lebih kuat dari yang lo kira."`
};

// Master Preset — Visual Style per channel (untuk thumbnail generation)
export const VISUAL_STYLE_PRESETS: Record<ChannelName, string> = {
  'Ilmu Lidi': `VISUAL STYLE — ILMU LIDI
- Warna dominan: Bold, kontras tinggi — kombinasi hitam, kuning neon, merah aksen
- Gaya thumbnail: Over-the-top, ekspresi wajah kaget/marah + gesture dramatis
- Komposisi: Simetris atau rule of thirds dengan elemen utama di tengah
- Typography: Font tebal, sering pakai efek 3D beveled, outline putih/tipis hitam
- Aksen: Emoji/icon spontan (money bag, fire, explode) untuk komedi
- Mood: Chaotic energy, seperti meme yang diklik ribuan kali`,

  'Ilmu Survival': `VISUAL STYLE — ILMU SURVIVAL
- Warna dominan: Dark palette — hitam, merah darah, abu-abu gelap, hijau army
- Gaya thumbnail: Dramatis dan cinematic — pencahayaan kontras (chiaroscuro)
- Komposisi: Terserah fokus pada karakter yang siap/was-was, latar chaos (api, kehancuran)
- Typography: Font sans-serif tebal, warna putih dengan shadow/drop shadow kuat
- Aksen: Simbol warning (segitiga peringatan, biohazard, target) — minimalis tapi impactful
- Mood: Serius, gelap, ada urgensi — "lo harus tonton sekarang"`,

  'Ilmu Nyantuy': `VISUAL STYLE — ILMU NYANTUY
- Warna dominan: Campuran ungu, biru gelap, oranye hangat — neon aksen untuk elemen spooky
- Gaya thumbnail: Split contrast — satu sisi normal, satu sisi "aneh/seram"
- Komposisi: Unbalanced asymmetry, elemen mengejutkan di sisi yang tidak terduga
- Typography: Mix bold + handwritten style, kadang font horror/vintage
- Aksen: Glitch effect, noise grain, siluet misterius — soft horror tanpa jumpscare
- Mood: "Serem tapi lucu", bikin penasaran — "wait, kok jadi aneh gini?"`,

  'Ilmu Psikologi Diri': `VISUAL STYLE — ILMU PSIKOLOGI DIRI
|- Warna dominan: Warm & calming — biru muda, lavender, krem, putih bersih
|- Gaya thumbnail: Ekspresi reflektif/introspektif — bukan kaget, tapi "oke, gue relate"
|- Komposisi: Clean, ruang kosong untuk text overlay, depth of field halus
|- Typography: Font sans-serif modern, minimalis, warna solid tanpa efek berlebih
|- Aksen: Subtle gradient, soft shadow, elemen simbolis (jantung, otak, muncul/desapare)
|- Mood: Empatik, hangat — seperti thumbnail podcast personal yang bikin penonton berhenti scroll`
};

// Default Hook & Outro per channel
export const HOOK_DEFAULTS: Record<ChannelName, boolean> = {
  'Ilmu Lidi': true,
  'Ilmu Survival': true,
  'Ilmu Nyantuy': false,
  'Ilmu Psikologi Diri': true,
};

export const OUTRO_DEFAULTS: Record<ChannelName, boolean> = {
  'Ilmu Lidi': true,
  'Ilmu Survival': true,
  'Ilmu Nyantuy': false,
  'Ilmu Psikologi Diri': true,
};
