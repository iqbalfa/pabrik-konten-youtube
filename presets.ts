
export const CHANNELS = ['Ilmu Lidi', 'Ilmu Survival', 'Ilmu Nyantuy', 'Ilmu Psikologi Diri', 'Richwell Finance'] as const;

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

TONE OPSIONAL — WARNING/URGENCY: Untuk konten tipe profiling atau "orang yang harus lo jauhi/ketahui", gunakan warning tone: bukan menakut-nakuti berlebihan, tapi ciptakan urgensi — "lo harus tahu ini sebelum terlambat" atau "selama lo gak sadar, lo terus jadi korban." Contoh: "Dalam hidup, ada orang-orang yang harus lo jauhi. Karena selama mereka ada di sekitar lo, lo gak akan pernah bisa bener-bener tenang." Tone ini efektif untuk konten "tipe orang" yang viral — berikan perasaan bahwa informasi ini PENTING untuk diketahui sekarang.

DIKSI: WAJIB gunakan kata ganti "lo" dan "gue" secara konsisten. DILARANG KERAS menggunakan "Anda", "saya", atau "kamu" kecuali dalam kutipan psikolog/riset. Sapaan "bro" boleh dipakai secara natural untuk menambah kedekatan — terutama di closing poin dan penutup. Gunakan bahasa Indonesia casual yang mudah dipahami, tapi tetap punya kedalaman. Hindari istilah psikologi berbahasa Inggris yang nggak perlu — terjemahkan ke bahasa Indonesia yang natural (contoh: "overthinking" → "mikir terus", "anxiety" → "rasa cemas", "toxic" → "racun/beracun"). Kecuali kalau istilah Inggris-nya sudah sangat populer dan lebih pas dipakai.

CIRI KHAS BERCERITA:
- VALIDASI DULU, BARU JELASKAN: Selalu mulai dengan validasi perasaan/ pengalaman penonton SEBELUM kasih penjelasan psikologi. Contoh: "Kalau lo sering ngerasa... itu bukan salah lo. Ada penjelasan psikologis di balik ini."
- IDENTITY RECOGNITION: Buat penonton merasa "dikenali". Gunakan pola: "Psikologi orang yang [sifat/kebiasaan]" atau "Kalau lo termasuk orang yang [X], ini yang sebenarnya terjadi di otak lo."
- REFRAME POSITIF: Setelah jelaskan "masalah", WAJIB berikan reframe yang membuat penonton merasa lebih baik tentang dirinya. Contoh: "Lo bukan malas — lo cuma perfectionist yang takut gagal."
- ANALOGI SEHARI-HARI (STRUKTUR WAJIB): Setiap poin narasi WAJIB punya minimal 1 analogi kehidupan sehari-hari yang hidup dan visual. Analogi bukan pelengkap — itu BACKBONE penjelasan. Buat analogi yang segar, relate, dan mudah dibayangkan. Contoh: "Energy vampire itu kayak colokan yang terus nyedot listrik, gak peduli baterai lo udah sekarat" atau "Tukang drama itu kayak api kecil yang terus nyamber ke mana-mana. Lo diem aja bisa kebakar." Hindari analogi klise — cari yang bikin penonton "oh iya bener juga."
- CONTOH KONKRET: Setiap poin harus punya 1-2 contoh nyata yang relate ke kehidupan penonton (kerja, sekolah, relationship, kebiasaan sehari-hari).

STRUKTUR NARATIF:
Babak 1 — Hook (Validasi + Curiosity / Warning):
Mulai dengan langsung address penonton: "Lo pernah nggak sih ngerasa [situasi]?" atau "Kalau lo termasuk orang yang [sifat], tonton ini sampai habis." Untuk konten tipe/warning, buka dengan urgensi: "Ada [tipe orang] yang harus lo ketahui. Selama lo gak sadar, lo terus jadi korban." Buat penonton merasa "ini video tentang gue" atau "gue harus tahu ini."

Babak 2 — Penjelasan (Fakta → Analogi → Efek → Reframe):
Setiap poin: (1) Fakta psikologi / riset yang relevan, (2) Analogi sehari-hari yang hidup, (3) Kenapa ini terjadi (mekanisme), (4) Gimana ini ngefek ke kehidupan sehari-hari, (5) Reframe positif atau langkah kecil yang bisa dilakukan, (6) Closing poin dengan "Ingat bro, [pesan empowerment singkat]" — formula closing konsisten yang bikin penonton merasa diperkuat.

Babak 3 — Penutup (Empowerment):
Akhiri dengan kalimat yang bikin penonton merasa "oke, gue ngerti sekarang, dan gue bisa handle ini." Jangan terlalu panjang. Satu kalimat kuat + CTA natural.

KATA PENUTUP KHAS: "Ingat — lo nggak sendirian. Dan lo lebih kuat dari yang lo kira." (Variasi: "Ingat bro, [pesan spesifik sesuai topik].")
`,

  'Richwell Finance': `STYLE PENULISAN: RICHWELL FINANCE

TONE: Calm authority with surgical precision. Narrator is not hype, not motivational, not alarmist. What they have is numbers — and a narrative that builds a story around those numbers that makes people feel like they've finally heard the truth nobody ran for them. Character: "The person who actually did the math while everyone else was sharing inspirational quotes."

Every statement has evidence. Every claim has a year-by-year breakdown. But it's not dry or academic — because they use real characters (Jake, Marcus, Alex, etc.), those numbers feel human, not spreadsheet.

Mood: like a friend who turns out to be really good at finance and is now explaining why your life hasn't leveled up — with a tone that doesn't judge, but also doesn't coddle with "it's okay, you're doing great."

Dominant emotion: realization, slightly uncomfortable revelation, then empowerment through understanding.

DICTION: Always use specific US/international nomenclature: 401k, S&P 500, Roth IRA, employer match, Federal Reserve, BLS, FICA, HSA, FSA, net worth. Numbers: ALWAYS specific and concrete. No "a lot" or "some money." $225. $6,738. Year 5. 18%. Not "after several years" — Year 10. No hedging. No "might" or "could be." If the math shows it, state it as fact.

SIGNATURE PHRASES (use naturally, not forced):
- "the crossover point" — signature concept, appears in every video
- "run the numbers" / "let me run the math"
- "here's the part nobody shows you"
- "that doesn't just cost you X — it costs you Y"
- "financially invisible"
- "the flat years"
- "psychologically bulletproof"
- "you're building a runway"
- "the plane doesn't take off at the beginning of the runway"
- "you're laying pavement that nobody will see or congratulate you for"
- "market's contribution vs your contribution"
- "below the crossover" / "above the crossover"
- "free money" (when referring to employer 401k match)
- "behavioral gap"
- "subsidizing [credit card company's] quarterly earnings"

STORYTELLING SIGNATURES:

1. TWO CHARACTERS WITH OPPOSING DECISIONS: Two people, same income, same starting line — but different financial decisions. One follows conventional wisdom, one follows the math. Tension is established before the answer is revealed. Example: Jake vs Marcus (debt snowball vs invest through debt). Example: Alex vs Jordan (saves 15% vs normal spending).

2. YEAR-BY-YEAR BREAKDOWN: Numbers run per year: Year 1, Year 2, Year 3... all the way to crossover. Every year has a concrete number — contribution vs market return. This is both a signature narrative AND visual device.

3. THE CROSSOVER POINT: The pivot concept present in every video. The specific turning point where the math starts working for that person. Year 10, Year 11, Year 23. This concept anchors the entire narrative.

4. CHALLENGER FRAME: Never says "conventional wisdom is wrong." Says instead: "Everyone says X. Let me show you what the math actually says." Then runs the numbers and lets the numbers speak.

5. BEHAVIORAL REALITY CHECK: Always a moment where math versus human behavior is separated. JP Morgan study: market returned 10%, average investor earned 3%. "Marcus' plan requires Marcus to behave like a robot. Marcus is a human being."

6. THE PLANE / RUNWAY METAPHOR: Runway metaphor appears consistently: "You're building a runway. The plane doesn't take off at the beginning. It takes off at the end. Every foot of pavement you lay down matters."

7. SENSATION NUMBER: A moment where a surprising figure becomes the headline: "$8,000 emergency turned into a $63,000 loss." "$175 a month savings after a $155K income." "3% investor return vs 10% market return."

STANDARD VIDEO STRUCTURE:

Act 1 — Opening (The Scene): Start with two real characters or one highly relatable character. Situation is familiar but the answer is counterintuitive. Always a tension: "They're both doing everything right. But one is winning and one is treading water."

Act 2 — The Conventional Answer: Meet the person following every rule. 15% savings rate. Budgeting app. Index fund. No debt except mortgage. They're doing everything the financial books tell them to do.

Act 3 — The Calculation: Year by year breakdown. Contributions vs market return. The flat years where the math is humiliating. Crossover point identified and named.

Act 4 — The Revelation: What the finance industry doesn't put on the chart. The crossover. The gap between where you are and where the math starts working. The behavioral gap.

Act 5 — The Three Levers: Three concrete things that actually move the needle: (1) Income architecture (not budgeting), (2) Protecting the base (emergency fund), (3) The crossover sprint (reaching escape velocity faster).

CLOSE — Return to the opening characters. Update their status. Net worth comparison at Year 10. Who's winning, who's not. End on the reframed understanding: "You're not behind. You're doing the hardest part — laying pavement nobody sees or applauds."

STANDARD OUTRO: Always the same structure: "If this changed how you think about [specific topic] — subscribe. We run the numbers that [the financial industry / finance bros / personal finance books] skip over. The real math. Not the highlight reel."`
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
- Warna dominan: Putih bersih sebagai background utama — aksen warna pada teks overlay (merah untuk elemen bahaya/urgensi, biru untuk elemen informasi). Karakter pakai warna tenang (navy, cokelat, biru muda) agar tidak berebut perhatian dengan teks.
- Gaya thumbnail: Edutainment clean — karakter kartun anime/2D simpel dalam pose analitis (memegang dagu berpikir, menunjuk ke objek). Pose karakter harus konkret dan langsung terbaca: LOPI (seseorang sedang menganalisis atau menunjuk sesuatu). Ekspresi fokus,好奇, atau微微 terkejut — bukan ekspresi horror/seram.
- Komposisi: Rule of thirds — teks overlay di sisi kiri (maksimal 40% lebar), karakter + objek utama di sisi kanan. Area bawah untuk objek-objek konkret yang mendukung topik (benda sehari-hari relate dengan konteks Indonesia: panci tergores, styrofoam, obat nyamuk, minumam manis, hp.retak, struk paylater, dll).
- Aksen: Efek glow kecil pada kata yang perlu menonjol. Benda sehari-hari sebagai curiosity object — objek yang langsung bikin penonton pikir "oh ini kan..." dan merasa relate.
- Mood: Informatif dan curious — "lo perlu tahu ini", "ini bahaya tapi lo mungkin gak sadar". Bukan horror/seram. Karakter adalah teman yang lagi kasih tahu fakta menarik, bukan hauntis.
- Latar: Putih polos atau sangat minimal (gradasi sangat halus). JANGAN latar gelap, glitch, noise grain, atau elemen misterius. Fokus pada objek dan karakter, bukan atmosphere.
- Branding: Karakter pakai hoodie/kupluk仙魔 — ini identitas channel yang harus konsisten.
- Elemen penting: Karakter harus MENUNJUK ke arah objek curiosity dengan tangan atau jari. Pose pointing ini crucial untuk storytelling visual.
- Typography/font/color: SEPENUHNYA dari reference image yang diunggah oleh user. JANGAN gunakan deskripsi tipografi dalam teks preset ini. Biarkan reference image menentukan gaya font, warna, hirarki, dan efek teks.
- Dilarang: Split-screen, VS layout, before-after comparison, glitch effect, font horror/vintage, latar gelap, siluet misterius, noise grain, elemen spooky.`,

  'Ilmu Psikologi Diri': `VISUAL STYLE — ILMU PSIKOLOGI DIRI
|- Warna dominan: Warm & calming — biru muda, lavender, krem, putih bersih
|- Gaya thumbnail: Ekspresi reflektif/introspektif — bukan kaget, tapi "oke, gue relate"
|- Komposisi: Clean, ruang kosong untuk text overlay, depth of field halus
|- Typography: Font sans-serif modern, minimalis, warna solid tanpa efek berlebih
|- Aksen: Subtle gradient, soft shadow, elemen simbolis (jantung, otak, muncul/desapare)
|- Mood: Empatik, hangat — seperti thumbnail podcast personal yang bikin penonton berhenti scroll
|- VISUAL THUMBNAIL: 2D fast digital scribble, whiteboard doodle style, dry-erase marker texture, thick messy lines, casual character illustration, pure white background, minimal flat colors, spontaneous energetic drawing, humorous explanation, No text if not mentioned`,

  'Richwell Finance': `VISUAL STYLE — RICHWELL FINANCE
|- Warna dominan: Bold, kontras tinggi — kombinasi hitam, kuning neon, hijau wealth (#00D47E), aksen emas/putih
|- Gaya thumbnail: Over-the-top, angka besar bold + gesture dramatis + ekspresi kaget/menang
|- Komposisi: Simetris atau rule of thirds, elemen utama (grafik/angka) di tengah
|- Typography: Font tebal, efek 3D beveled, outline putih/tebal, angka jadi hero element
|- Aksen: Emoji/icon spontaneous (dollar sign, grafik naik, money bag, fire) untuk sense of urgency
|- Mood: Chaotic energy finance — "uang lo travaille terus tanpa lo sadari" — like a meme that got a finance degree`
};

// Default Hook & Outro per channel
export const HOOK_DEFAULTS: Record<ChannelName, boolean> = {
  'Ilmu Lidi': true,
  'Ilmu Survival': true,
  'Ilmu Nyantuy': false,
  'Ilmu Psikologi Diri': true,
  'Richwell Finance': true,
};

export const OUTRO_DEFAULTS: Record<ChannelName, boolean> = {
  'Ilmu Lidi': true,
  'Ilmu Survival': true,
  'Ilmu Nyantuy': false,
  'Ilmu Psikologi Diri': true,
  'Richwell Finance': true,
};
