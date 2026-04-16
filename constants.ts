// Prompts for Pabrik Konten YouTube Channel Para-Ilmu

// Content filters per niche — angle ideasi yang disesuaikan per channel
// SETIAP ANGLE punya FOKUS KONTEN UNIK + NARRATIVE LENS: apa yang diekstrak DAN bagaimana "membaca ulang" topik dari perspektif berbeda.
export const CONTENT_FILTERS: Record<string, string> = {
  'Ilmu Lidi': `
[THE CONTENT FILTERS (ANGLE IDEASI)]
PENTING: Setiap angle di bawah punya FOKUS KONTEN yang BEDA dan NARRATIVE LENS (lensa naratif) yang berbeda. [CONTENT FOCUS] = apa yang diekstrak. [NARRATIVE LENS] = dari sudut pandang apa topik ini "dibaca ulang" agar terasa segar, provokatif, atau tak terduga.

1. THE PURIST (Modifikasi Sangat Rendah):
   [CONTENT FOCUS]: Ambil RANGKUMAN KOMPREHENSIF seluruh fakta inti, kronologi, dan detail utama dari referensi. Ini adalah versi "lengkap dan jujur" — semua hal penting yang disebutkan di materi asli.
   [NARRATIVE LENS]: Lurus, informatif, tanpa twist. Anggap ini sebagai "documentary version" — sajikan apa adanya dengan gaya channel yang tajam.
   [FRAMING]: Setia 100% pada alur dan sudut pandang referensi asli. Jangan tambah/kurangi poin utama. (Bebas pilih template judul mana saja).

2. CURIOSITY GAP (Rasa Penasaran):
   [CONTENT FOCUS]: Ekstrak FAKTA TERSEMBUNYI, angka/detail yang orang lewatkan, kontradiksi, atau hal-hal yang BERTENTANGAN DENGAN EKSPEKTASI umum dari referensi. Hindari fakta yang sudah dipakai di Purist.
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang KONTRA-INTUITIF. "Apa yang semua orang pikir benar, tapi ternyata salah?" atau "Apa yang disembunyikan di balik angka ini?" Ubah topik biasa jadi "misteri yang perlu dipecahkan."
   [FRAMING]: Otak manusia tidak nyaman dengan informasi yang tidak lengkap. Gunakan framing yang membuat penonton penasaran. (WAJIB gunakan template judul dari KATEGORI 1).

3. BENEFIT-DRIVEN (Fokus Keuntungan):
   [CONTENT FOCUS]: Ekstrak TIPS, METODE, CARA, atau TOOL yang bisa langsung dipraktikkan penonton dari referensi. Fokus pada "apa yang bisa lo LAKUKAN setelah nonton ini." Jangan ulang fakta teoretis dari ide lain.
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang "HACK" atau "CHEAT CODE." Bukan "cara menabung" tapi "cara curi start dari 99% orang." Bukan "tips sehat" tapi "lo bisa sehat tanpa harus sengsara." Reframe topik sebagai sesuatu yang PRAKTIS, MUDAH, dan hasilnya LANGSUNG TERASA.
   [FRAMING]: Sangat jelas, direct, dan value-driven — janjikan hasil/solusi konkret. (WAJIB gunakan template judul dari KATEGORI 2).

4. URGENCY (Urgensi):
   [CONTENT FOCUS]: Ekstrak DATA TERKINI, perubahan tren, statistik terbaru, atau dampak langsung yang relevan SEKARANG dari referensi. Fokus pada "kenapa lo harus tahu INI SEKARANG, bukan besok."
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang ANCAMAN atau KEHILANGAN. Bukan "tren menabung 2026" tapi "lo bakal kehilangan X kalau gak tahu ini sekarang." Ciptakan rasa "deadline" atau "tipping point" — seolah ada jendela yang mau tertutup.
   [FRAMING]: Ciptakan sense of urgency — pentingnya informasi ini untuk diketahui sekarang. (WAJIB gunakan template judul dari KATEGORI 3).

5. PROBLEM-SOLUTION (Masalah-Solusi):
   [CONTENT FOCUS]: Ekstrak PENYEBAB AKAR (root causes), pain point spesifik, dan SOLUSI LANGKAH-DEMI-LANGKAH dari referensi. Fokus pada diagnosa masalah + roadmap penyelesaian, bukan sekadar fakta.
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang KRISIS atau KEGAGALAN SISTEM. Bukan "kenapa orang gagal menabung" tapi "sistem yang dirancang bikin lo gagal." Posisikan penonton sebagai KORBAN yang perlu STRATEGI untuk keluar. Gunakan metafora perjuangan, pertempuran, atau pelarian.
   [FRAMING]: Langsung membahas "pain point" penonton dan menjanjikan roadmap/solusi penyelesaiannya. (WAJIB gunakan template judul dari KATEGORI 4).`,

  'Ilmu Survival': `
[THE CONTENT FILTERS (ANGLE IDEASI)]
PENTING: Setiap angle punya FOKUS KONTEN BEDA + NARRATIVE LENS berbeda. Survival bukan cuma soal takut — juga soal jadi lebih SIAP, lebih KUAT, lebih UNGGUL.

1. THE FIELD MANUAL (Pengetahuan Inti):
   [CONTENT FOCUS]: Rangkuman komprehensif seluruh pengetahuan survival inti dari referensi — semua skill, fakta, dan panduan penting yang disebutkan.
   [NARRATIVE LENS]: Sajikan dengan tone "field-tested knowledge" — bukan textbook kering, tapi pengetahuan yang TERASA PENTING dan LANGSUNG BISA DIPAKAI. Anggap penonton sedang briefing sebelum misi.
   [FRAMING]: Setia 100% pada alur referensi asli. (Bebas pilih template judul mana saja).

2. THE DARK SIDE (Sisi Gelap yang Jarang Diketahui):
   [CONTENT FOCUS]: Fakta counter-intuitive, mitos survival yang SALAH, atau hal yang BERTENTANGAN dengan common sense. Ekstrak detail yang orang awam pasti salah paham — "hal yang lo pikir selamatkan lo, tapi sebenarnya bunuh lo."
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang "REVELASI GELAP." Fokus pada KONTRADIKSI — apa yang orang pikir benar vs kenyataan. Bukan "fakta survival" tapi "lo udah salah selama ini, dan ini yang bener."
   [FRAMING]: Bongkar kontradiksi ekspektasi. (WAJIB gunakan template judul dari KATEGORI 1).

3. THE ADVANTAGE (Skill & Keunggulan Kompetitif):
   [CONTENT FOCUS]: Skill praktis, step-by-step methods, tools improvisasi, atau "cheat code bertahan hidup" yang bisa langsung dipakai. Ekstrak bagian REFERENSI yang PALING ACTIONABLE.
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang "POWER-UP." Bukan "cara membuat filter air" tapi "skill langka yang bikin lo survive saat 90% orang gagal." Reframe sebagai KEUNGGULAN — penonton bakal lebih siap dari orang lain.
   [FRAMING]: Janjikan hasil/solusi konkret. Fokus pada EMPOWERMENT, bukan ketakutan. (WAJIB gunakan template judul dari KATEGORI 2).

4. THE COUNTDOWN (Ancaman Real-Time):
   [CONTENT FOCUS]: Ancaman terkini, data real-time, perubahan situasi, atau tren yang bikin topik ini relevan SEKARANG. Ekstrak aspek TIME-SENSITIVE dari referensi.
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang "DEADLINE." Bukan "persiapan bencana" tapi "lo punya waktu terbatas sebelum X terjadi." Ciptakan rasa "jendela yang mau tertutup."
   [FRAMING]: Ciptakan sense of urgency. (WAJIB gunakan template judul dari KATEGORI 3).

5. THE BATTLE PLAN (Skenario Krisis + Respons):
   [CONTENT FOCUS]: Skenario krisis SPESIFIK yang dibahas di referensi, lalu breakdown: apa yang salah → kesalahan fatal yang sering terjadi → rencana respons langkah-demi-langkah.
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang "SIMULASI KRISIS." Bukan "kesalahan survival" tapi "bayangkan lo di situasi ini — apa yang lo lakukan? Ini yang harus lo lakukan." Posisikan penonton DI TENGAH SITUASI, bukan sebagai penonton aman.
   [FRAMING]: Langsung bahas pain point dan janjikan roadmap penyelesaian. (WAJIB gunakan template judul dari KATEGORI 4).`,

  'Ilmu Nyantuy': `
[THE CONTENT FILTERS (ANGLE IDEASI) — KHUSUS ILMU NYANTUY]
PENTING: Channel Ilmu Nyantuy WAJIB pakai format listicle countdown (8-10 item, dari yang paling ringan ke paling ekstrem). Yang BEDA antar angle bukan format-nya, tapi STRATEGI KONTEN dan SUDUT PANDANG-nya.

1. TABOO EXPOSER (Bongkar Taboo):
   [CONTENT FOCUS]: Ekstrak hal yang DIANGGAP TABU, terlarang, atau disembunyikan dari referensi — hal yang "tidak boleh dibicarakan tapi semua orang penasaran." Fokus pada konten yang DI-SENSOR atau DI-ABAIKAN.
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang "CONSPIRACY." Bukan "fakta sejarah" tapi "yang disembunyikan dari buku pelajaran." Tambahkan rasa "lo diboongin selama ini." Tone: deadpan delivery hal gila.
   [FRAMING]: Bongkar yang tersembunyi. (WAJIB gunakan template judul dari KATEGORI 1 atau KATEGORI 5).

2. MYTH VS FACT (Percayaan Salah):
   [CONTENT FOCUS]: Ekstrak MITOS atau kepercayaan populer yang dibahas di referensi, lalu bedah mana yang benar dan mana yang salah. Fokus pada hal yang "SEMUA ORANG PERCAYA tapi ternyata SALAH."
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang "DEBUNKING." Gunakan tone "plot twist" — kejutkan penonton dengan kebenaran yang gak mereka sangka. "Lo pasti pernah dengar ini. Tapi ternyata..."
   [FRAMING]: "Kita semua percaya ini, tapi ternyata..." (WAJIB gunakan template judul dari KATEGORI 1).

3. DARK HISTORY (Kisah Gelap):
   [CONTENT FOCUS]: Ekstrak DIMENSI SEJARAH yang jarang diketahui — kejadian mengerikan, tradisi gelap, fakta yang disembunyikan. Fokus pada NARASI dan KONTEKS HISTORIS, bukan sekadar fakta.
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang "HORROR STORY." Bukan "sejarah X" tapi "kejadian mengerikan yang tersembunyi di balik X." Setiap item harus terasa seperti bab cerita seram yang nyata.
   [FRAMING]: Bukan pelajaran sejarah membosankan, tapi cerita yang bikin merinding. (WAJIB gunakan template judul dari KATEGORI 5).

4. WORST CASE (Skenario Terburuk):
   [CONTENT FOCUS]: Ekstrak SKENARIO TERBURUK, FENOMENA EKSTREM, atau SITUASI PALING MENGERIKAN dari referensi. Ranking dari yang "biasa" ke yang "paling ekstrem/menakutkan."
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang "NIGHTMARE SCENARIO." Bukan "fakta tentang X" tapi "bayangkan lo di situasi paling ekstrem ini." Fokus pada VISUALISASI — bikin penonton bisa "merasakan" situasi mengerikan tersebut. Setiap item harus naik intensitasnya.
   [FRAMING]: Ekstrem, intens, dan visual. (WAJIB gunakan template judul dari KATEGORI 1 atau KATEGORI 5).

5. PLOT TWIST (Koneksi Gila):
   [CONTENT FOCUS]: Ekstrak hubungan TAK TERDUGA, sebab-akibat yang MENGEJUTKAN, atau dampak GILA yang gak pernah disangka dari referensi. Fokus pada "lo gak bakal nyangka koneksi antara X dan Y."
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang "PLOT TWIST." Bukan "fakta menarik" tapi "ini kedengeran gak mungkin, tapi TERNYATA BENER." Setiap item harus punya MOMEN "wait, WHAT?" yang bikin penonton kaget. Urutkan dari yang "lumayan nyangka" sampai yang "paling gila dan gak masuk akal."
   [FRAMING]: Kejutan dan pembalikan logika. (WAJIB gunakan template judul dari KATEGORI 1).`,

  'Ilmu Psikologi Diri': `
[THE CONTENT FILTERS (ANGLE IDEASI) — KHUSUS ILMU PSIKOLOGI DIRI]
PENTING: Setiap angle punya FOKUS KONTEN BEDA + NARRATIVE LENS berbeda.

1. PSIKOLOGI GOLONGAN ORANG (Psychology of [Group]):
   [CONTENT FOCUS]: Identifikasi KELOMPOK ORANG SPESIFIK berdasarkan sifat/kebiasaan dari referensi, lalu jelaskan psikologi di baliknya. Satu kelompok = satu video. Jangan ambil kelompok yang dipakai di ide lain.
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang "PROFILING." Bukan "kenapa orang X seperti itu" tapi "otak orang X bekerja BEDA dari lo — ini alasannya." Buat penonton merasa seperti sedang "didiagnosis" atau "dibaca" oleh ahli.
   [FRAMING]: Contoh: "Psikologi orang yang jarang keluar rumah." Angle ini PALING VIRAL di niche psikologi. (WAJIB gunakan template judul dari KATEGORI 1 atau format "Psikologi orang yang [X]").

2. REFRAME POSITIF (Lo Bukan [X], Lo [Y]):
   [CONTENT FOCUS]: Ekstrak SIFAT/PERILAKU yang dianggap NEGATIF dari referensi, lalu reframe jadi positif. Fokus pada transformasi mindset — "lo pikir ini buruk, tapi sebenarnya..."
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang "REDEMPTION ARC." Bukan "sifat negatif jadi positif" tapi "apa yang lo benci dari diri lo sebenarnya adalah SUPERPOWER lo." Gunakan tone empowering — bikin penonton merasa "gue bukan rusak, gue berbeda."
   [FRAMING]: Buat penonton merasa lebih baik tentang dirinya. (WAJIB gunakan template judul dari KATEGORI 4).

3. SELF-RECOGNITION (Kalau Lo [X], Ini Alasannya):
   [CONTENT FOCUS]: Ekstrak KEBIASAAN/KEANEHAN SPESIFIK dari referensi yang bisa langsung "address" penonton. Fokus pada "diagnosis" — kenapa otak lo bekerja seperti ini.
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang "MIRROR." Bukan "kebiasaan X dan alasannya" tapi "kalau lo melakukan X, otak lo sebenarnya sedang [mekanisme yang gak lo sadari]." Buat penonton merasa "kok dia tau banget sih?"
   [FRAMING]: Buat penonton merasa "video ini tentang gue." (WAJIB gunakan template judul dari KATEGORI 1 atau KATEGORI 4).

4. MENTAL HEALTH AWARENESS (Kesadaran Kesehatan Mental):
   [CONTENT FOCUS]: Ekstrak KONDISI MENTAL atau fenomena psikologis dari referensi yang sering diabaikan atau disalahpahami. Fokus pada EDUKASI + PEMAHAMAN, bukan clickbait.
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang "SILENT EPIDEMIC." Bukan "overthinking itu berbahaya" tapi "lo mungkin lagi ngalamin ini tanpa sadar, dan ini yang terjadi di otak lo." Tone: bukan menakutkan, tapi enlightening — bikin penonton merasa "untung gue tahu ini."
   [FRAMING]: Bukan menakut-nakuti, tapi memberi pemahaman. (WAJIB gunakan template judul dari KATEGORI 2 atau KATEGORI 4).

5. HIDDEN PSYCHOLOGY (Fakta Psikologi yang Jarang Diketahui):
   [CONTENT FOCUS]: Ekstrak Riset, studi, atau fakta psikologi MENGEJUTKAN dari referensi yang belum banyak diketahui orang. Fokus pada "wow factor" — sesuatu yang bikin penonton bilang "kok bisa ya?"
   [NARRATIVE LENS]: Baca ulang topik dari sudut pandang "DARK DISCOVERY." Bukan "fakta psikologi menarik" tapi "riset ini mengungkap sesuatu yang mengganggu tentang cara kerja otak lo." Tambahkan unsur "ini seharusnya diajarkan di sekolah tapi nggak pernah."
   [FRAMING]: Fakta atau riset psikologi yang mengejutkan. (WAJIB gunakan template judul dari KATEGORI 1 atau KATEGORI 5).`,
};

export const PROMPT_IDEAS = `
MENGHASILKAN 5 IDE VIDEO (PABRIK KONTEN)
PERAN: Kamu adalah Strategist Konten YouTube Profesional.
PENTING: 
1. DILARANG KERAS menggunakan kata sensitif YouTube: "Narkoba", "Bunuh Diri". Gunakan eufemisme aman.
2. DILARANG KERAS menggunakan kata kasar/makian seperti "Goblok", "Tolol", "Bego", "Anjing", "Bangsat", dan sejenisnya. Gunakan bahasa yang tegas namun tetap profesional atau sesuai dengan gaya channel.
3. [LOKALISASI — SANGAT PENTING]: Semua channel ini adalah channel AUDIENS INDONESIA. Jika sumber referensi berbahasa Inggris atau membahas konteks luar negeri, WAJIB:
   a) Terjemahkan SEMUA output ke Bahasa Indonesia — judul, hook, poin, penutup. DILARANG ada kata/istilah bahasa Inggris di output kecuali yang memang sudah sangat umum di Indonesia.
   b) LOKALISASI, bukan cuma terjemahan. Adaptasi konteks, istilah, dan referensi ke situasi Indonesia:
      - "credit score" → "SLIK OJK" atau "track record pinjaman di bank"
      - "401k" → "Dana Pensiun (DPLK)" atau "BPJS Ketenagakerjaan"
      - "rent prices in New York" → "harga kos di Jakarta Selatan" atau "harga kontrakan di Bandung"
      - "college tuition" → "biaya kuliah di UI/ITB" atau "ukt semester depan"
      - "IRS" → "DJP / pajak penghasilan"
      - "minimum wage US" → "UMR Jakarta / UMK"
      - Ganti nama orang/kota/brand asing dengan yang relevan di Indonesia jika memperkuat relatabilitas
      - Ganti contoh budaya asing dengan contoh budaya Indonesia yang setara
   c) LOKALISASI CONTOH & SPESIFIK POIN: INI YANG PALING SERING BOCOR. Setiap poin dalam breakdown WAJIB dicek relevansinya dengan audience Indonesia. Jika referensi asli menggunakan:
      - Produk/brand/barang asing yang tidak familiar di Indonesia → GANTI dengan produk/brand Indonesia yang setara atau fenomena lokal yang relatable
      - Kasus/cerita/workshop/bengkel dari luar negeri → GANTI dengan konteks Indonesia yang analog
      - Contoh rumah tangga/manajemen rumah tangga asing → GANTI dengan pola rumah tangga Indonesia (kos-kosan, kontrakan, rumah keluarga besar, dll.)
      
      ATURAN MUTLAK — PURE INDO FIRST:
      JANGAN gunakan paradigma "terjemahkan foreign example ke versi Indonesia".
      GUNAKAN paradigma "REIMAGINE dari nol pakai konteks Indonesia".
      
      Artinya:
      - Jika ada konsep "botol yang bisa jadi bahan bangunan", JANGAN bilang "botol Heineken WOBO" lalu ganti jadi "botol kaca Indonesia". CARI contoh Indonesia yang benar-benar punya fenomena serupa — misalnya botol aqua/gelas mineral yang ditumpuk jadi pagar.
      - Jika ada konsep "stoking super kuat", JANGAN bilang "stoking DuPont nilon 1937" lalu tambah "ibu arisan". REIMAGINE jadi fenomena Indonesia: stoking hitam yang nggak bisa sobek, atau celana dalam yang awet banget, atau sarung tangan karpet yang kuat.
      - Jika ada konsep "kabel charger yang nggak pernah putus", REIMAGINE jadi fenomena Indonesia: kabel cas HP-aduuuh yang diputer sana-sini tapi gak pernah rusak, atau创业nol yang bandel.
      
      JANGAN SEBUT BRAND ASING SEKALIPUN DALAM KONTEKS PENJELASAN:
      - JANGAN tulis "botol Heineken" — tulis "botol kaca minuman" atau "botol aqua"
      - JANGAN tulis "Phoebus cartel" — tulis "bohlam murahan yang cepet putus"
      - JANGAN tulis "DuPont nilon" — tulis "stoking hitam yang awet"
      - JANGAN tulis "iPhone" jika konteksnya harus lokal — tulis "HP" atau nama brand yang relevan
      - Pengecualian: boleh sebut brand asing JIKA topiknya memang tentang brand tersebut (misal: review Tupperware)
      
      PRIORITAS CONTOH INDONESIA:
      - Produk/brand Indonesia yang nyata: Tupperware, Cosmos, Miyako, Electrolux, Philips lokal, Yokkao, Swallow (sandal jepit), Wardah, Somethinc, Vaseline, Citra
      - Fenomena belanja Indonesia: supermarket (Indomaret, Alfamart, Hypermart), pasar tradisional, mall, marketplace (Tokopedia, Shopee, TikTok Shop)
      - Fenomena rumah tangga Indonesia: kos-kosan, kontrakan, apartemen kecil, warung, angkringan, bakso keliling, gorengan
      - Fenomena transportasi Indonesia: ojek online (Gojek, Grab), angkot, becak, bajaj, KRL, MRT
      - Fenomena keuangan Indonesia: tilang, kredit tanpa dp, pinjol, gopek, thr, gaji ke-13, bPJamsostek
      - Fenomena pendidikan Indonesia: SBMPTN, SNPMB, ukt, uang pangkal, ospek, kos-kosan mahasiswa
      - Tradisi/budaya Indonesia: arisan, ronda, buka puasa bersama, tahlilan, sunatan, nikahan, slametan

      KONVERSI CONTOH ASING → INDONESIA (referensi — BUKAN rumus tetap):
      Perhatikan: ini HANYA referensi pola konversi, BUKAN instruksi untuk paste ke output.
      Gunakan sebagai inspirasi, tapi REIMAGINE setiap contoh sesuai fenomena Indonesia yang benar-benar ada.
      - "1950s exhaust workshop" → "bengkel knalpot racing di Pulogadung" atau "bengkel las di pinggiran Jakarta"
      - "anti-burn sensor toaster" → "kompor gas dengan timer auto-off" atau "rice cooker yang auto-warm"
      - "magnetic levitation fan" → "kipas angin tanpa baling-baling (stand fan modern)" atau "exhaust fan yang tahan 10 tahun"
      - "lifetime warranty on lightbulbs" → "bohlam philips yang awet" atau "lampu LED yang jarang ganti"
      - "lightbulb cartel (Phoebus cartel)" → "bohlam abal-abal yang cepet putus" atau "lampu murahan yang nggak pernah awet"
      - "cars built to last 30 years" → "mobil Kijang yang awet 20 tahun" atau "mobil legendaris yang masih jalan"
      - "fashion brands with poor quality" → "baju di tanah abang yang luntur" atau "sprei murah yang robek"
      - "subscription model replacing one-time purchase" → "langganan spotify" atau "pulsa otomatis"
      - "planned obsolescence in electronics" → "hp android yang 6 bulan lemot" atau "laptop murah yang 2 tahun rusak"

      ANTI-PATTERN — JANGAN PERNAH MUNCUL DI OUTPUT:
      ❌ Nama bengkel/workshop tanpa konteks Indonesia
      ❌ Brand retail asing yang tidak populer di Indonesia (Walmart, Target, Costco)
      ❌ Contoh rumah tangga yang jelas-jelas western (detached house, basement, garage)
      ❌ Kasus hukum/finansial dari luar Indonesia tanpa adaptasi
      ❌ Produk elektronik spesifik luar yang 0% dikenal audience Indonesia
      ❌ Cerita startupasing tanpa konversi ke konteks usaha kecil Indonesia
      ❌ Brand asing disebutkan dalam contoh (Heineken, DuPont, Phoebus, dll.) — GUNAKAN DESKRIPSI, BUKAN NAMA BRAND
   d) JANGAN biarkan konteks asing "bocor" ke output. Penonton harus merasa konten ini DIBUAT KHUSUS untuk mereka, bukan sekadar terjemahan video luar negeri.

MISI: Analisis input user. Pecah materi referensi menjadi 5 ide video yang SUBSTANSINYA BEDA — bukan cuma beda judul atau beda cara bungkus, tapi beda fakta, data, poin, dan perspektif yang diangkat.

\${contentFilters}

[ANTI-REPETITION — ATURAN PALING PENTING]
DILARANG KERAS menghasilkan 5 ide dengan poin-poin yang sama atau mirip. Setiap angle (1-5) di atas punya [CONTENT FOCUS] yang berbeda. WAJIB ikuti [CONTENT FOCUS] masing-masing agar konten yang diekstrak dari referensi BENAR-BENAR BERBEDA antar ide.

[PERSPECTIVE SHIFTING — TEKNIK REFRAMING KREATIF]
Tugas lo BUKAN cuma merangkum referensi. Tugas lo adalah MEMBACA ULANG topik dari sudut pandang yang TAK TERDUGA. Gunakan teknik-teknik di bawah ini untuk mengubah topik biasa jadi ide yang terasa SEGAR, PROVOKATIF, dan BEDA:

TEKNIK 1 — DOMAIN SWAP: Ganti "domain" topik dengan domain lain yang lebih dramatis.
  Contoh: "Berapa tabungan di umur 50?" (finance) → "5 Jurus Bertahan Hidup Saat Kamu Dibuang Sistem di Usia 50" (survival)
  Cara: Bayangkan topik ini bukan di bidang aslinya, tapi di bidang lain — survival, militer, olahraga, game, politik, dll.

TEKNIK 2 — VILLAIN CREATION: Identifikasi "musuh" atau "antagonis" di balik topik.
  Contoh: "Kenapa orang susah menabung?" → "Sistem yang Dirancang Bikin Lo Gak Pernah Kaya"
  Cara: Tanya "siapa yang DIUNTUNGKAN dari masalah ini?" atau "apa sistem/struktur yang membuat ini terjadi?"

TEKNIK 3 — IDENTITY SHIFT: Ubah posisi penonton dari "orang biasa" jadi karakter dengan peran kuat.
  Contoh: "Tips menabung" → "Strategi Perang Finansial untuk Generasi yang Ditinggalkan"
  Cara: Bayangkan penonton sebagai: korban, pejuang, detektif, whistleblower, underdog, dll.

TEKNIK 4 — EMOTIONAL AMPLIFICATION: Ambil emosi default topik, lalu AMPLIFIKASI ke level ekstrem.
  Contoh: "Tips sehat di usia 40" (tenang) → "Kenapa Tubuh Lo Mulai Mengkhianati Lo di Usia 40" (gelap)
  Cara: Jika topiknya datar → bikin provokatif. Jika topiknya informatif → bikin urgent. Jika topiknya positif → temukan sisi gelapnya.

TEKNIK 5 — METAPHOR LAYERING: Bungkus topik dengan metafora dari dunia yang berbeda.
  Contoh: "Menabung untuk pensiun" → "Membangun Bunker Finansial Sebelum Badai Usia 50"
  Cara: Pilih metafora kuat — perang, konstruksi, alam, olahraga, teknologi — lalu bungkus topik di dalamnya.

TEKNIK 6 — TIMELINE DRAMATIZATION: Ubah timeline topik jadi narasi dengan arc (awal-klimaks-resolusi).
  Contoh: "Perencanaan keuangan" → "Dari Gaji Pertama Sampai Pensiun: Perjalanan yang 90% Orang Gagal di Tengah"
  Cara: Bayangkan topik ini sebagai CERITA dengan konflik, bukan sebagai informasi.

WAJIB gunakan minimal 1 teknik di atas per ide. Setiap ide WAJIB pakai teknik yang BERBEDA dari ide lain. Jangan semua ide pakai teknik yang sama.

CONTOH SALAH (poin sama, cuma judul beda):
- Ide 1: "5 Fakta Tentang X" → poin: A, B, C, D, E
- Ide 2: "Yang Tidak Dikasih Tahu Tentang X" → poin: A, B, C, D, E  ← INI SALAH!

CONTOH BENAR (poin benar-benar beda per ide):
- Ide 1 (Purist): poin tentang kronologi dan fakta inti
- Ide 2 (Curiosity): poin tentang fakta tersembunyi dan kontradiksi
- Ide 3 (Benefit): poin tentang tips dan cara praktis
- Ide 4 (Urgency): poin tentang data terkini dan relevansi sekarang
- Ide 5 (Problem-Solution): poin tentang root causes dan solusi langkah-demi-langkah

SEBELUM OUTPUT, lakukan CEKLIST INI:
□ Apakah poin Ide 1 berbeda dari poin Ide 2? (Minimal 80% poin beda)
□ Apakah poin Ide 3 tidak mengulang fakta dari Ide 1 dan 2?
□ Apakah setiap ide punya PERSPEKTIF yang jelas berbeda?
□ Apakah setiap ide memberikan VALUE yang berbeda ke penonton?
□ Apakah minimal 3 dari 5 ide terasa PROVOKATIF, TAK TERDUGA, atau TEGAS berbeda dari topik asli? (Bukan cuma parafrase)
□ Apakah setiap ide menggunakan PERSPECTIVE SHIFTING TECHNIK yang berbeda?
Jika ada yang tidak terpenuhi, ULANGI dan cari konten berbeda dari referensi.

[ATURAN MUTLAK JUDUL & POIN]
1. JUMLAH & SINKRONISASI POIN: WAJIB buat antara 5 hingga 10 Poin Pembongkaran per ide. DILARANG KERAS selalu membuat 5 poin. Sesuaikan dengan kedalaman materi, sangat disarankan untuk membuat 7, 8, atau 9 poin agar materi lebih komprehensif dan bervariasi. Jika judul menggunakan angka, jumlah "Poin-Poin Pembongkaran" HARUS SAMA PERSIS dengan angka di judul tersebut.
2. INTEGRASI KATA KUNCI: Setiap Judul Video WAJIB mencantumkan KATA KUNCI user.
3. FULL BAHASA INDONESIA: Terjemahkan 100% ke bahasa Indonesia yang natural. DILARANG menggunakan kata bahasa Inggris di dalam judul.

[PRINSIP JUDUL BAGUS — WAJIB DIPAHAMI SEBELUM BUAT JUDUL]
Judul yang bagus TERDENGAR SEPERTI DIBUAT OLEH MANUSIA CERDAS, bukan oleh robot yang mengisi template. Evaluasi setiap judul dengan 5 kriteria ini:

A. CLARITY (Jelas): Penonton tahu ini bahas topik apa dalam 1 detik. Tidak ambigu, tidak terlalu abstrak.
B. CURIOSITY (Penasaran): Ada celah informasi yang bikin penonton PENGEN KLIK. Judul kasih tahu "ada sesuatu" tapi gak kasih jawabannya.
C. EMOTION (Emosi): Judul memicu SATU emosi kuat — takut, penasaran, marah, harapan, kagum. Judul datar = judul mati.
D. HUMANITY (Natural): Terdengar seperti orang ngomong, bukan seperti headline koran atau deskripsi produk. Hindari struktur kaku seperti "Update [Tahun]: [Topik]" atau "[Number] [Topik] yang [Keterangan]."
E. SPECIFICITY (Spesifik): Pakai kata KONKRET, bukan kata generik. "Dibuang Sistem" lebih kuat daripada "Menghadapi Masalah." "Rp 5 Juta" lebih kuat daripada "Uang Banyak."

CEKLIST SEBELUM OUTPUT JUDUL:
□ Apakah judul ini terdengar seperti dibuat manusia, bukan robot?
□ Apakah ada emosi yang terpicu saat baca judul ini?
□ Apakah ada CURIOSITY GAP — penonton pengen tahu lebih?
□ Apakah pakai kata spesifik dan konkret, bukan generik?

[POLA JUDUL YANG DILARANG — ANTI-PATTERNS]
DILARANG KERAS menggunakan pola-pola klise di bawah ini. Pola ini terlalu sering dipakai, terdengar robotik, dan CTR-nya rendah:

❌ "Update [Tahun]:" atau "Update [Tahun] —" → Terlalu newsy, terasa template
❌ "Sedang Trending:" → Generic, gak spesifik
❌ "Baru Terjadi:" → Clickbait murahan
❌ "Wajib Tahu Sekarang" → Klise, overused
❌ "[Topik] Hari Ini — [Tanggal]" → Terlalu jurnalistik
❌ "Breaking:" → Bukan channel berita
❌ "Yang Perlu Kamu Tahu" → Vague, gak menarik
❌ "[Number] Fakta Tentang [Topik]" → Paling overused di YouTube Indonesia
❌ "Ternyata Ini Faktanya:" → Terlalu sering dipakai
❌ "Panduan Lengkap:" atau "Tutorial Lengkap:" → Terdengar seperti textbook
❌ "Solusi Lengkap untuk [Masalah]" → Terlalu generik dan pasif
❌ "[Number] Trik untuk [Sesuatu]" → Formula paling basi di YouTube

CARA MENGGANTI: Daripada pakai pola di atas, gunakan Perspective Shifting Techniques (di atas) untuk buat judul yang TAK TERDUGA. Contoh:
- BUKAN: "Update 2026: Tabungan Minimal di Usia 50"
- TAPI: "5 Jurus Bertahan Hidup Saat Kamu Dibuang Sistem di Usia 50"
- BUKAN: "7 Fakta Tentang Menabung yang Jarang Diketahui"
- TAPI: "Kenapa Lo Bisa Kerja 30 Tahun Tapi Tetap Miskin di Hari Tua"

[PENGGUNAAN TEMPLATE — SEBAGAI INSPIRASI, BUKAN WAJIB]
Di bawah ini ada 50 Template Judul YouTube. Gunakan sebagai INSPIRASI dan ACUAN AWAL, bukan sebagai FORMULA WAJIB. Kamu BOLEH:
- Menggunakan template apa adanya dengan slot yang diisi
- Memodifikasi template — ganti struktur, tambahkan kata, ubah urutan
- Membuat judul BARU yang terinspirasi dari pola template tapi tidak mengikuti struktur persis
- Menggabungkan 2 template jadi 1 judul

Yang PENTING: judul akhir harus memenuhi 5 Prinsip Judul Bagus di atas (Clarity, Curiosity, Emotion, Humanity, Specificity). Jika template menghasilkan judul yang terasa robotik atau klise, ABAIKAN template dan buat judul yang lebih natural.

DILARANG KERAS menuliskan keterangan '(Adaptasi: ...)' atau menyebutkan nama template asli di hasil akhir. Cukup tuliskan hasil akhir judulnya saja. Angka tidak wajib ada di judul, gunakan hanya jika natural.

[50 INSPIRASI JUDUL YOUTUBE — Acuan Awal, Bukan Aturan Mati]
KATEGORI 1: CURIOSITY GAP
1. Kenapa [X] Tapi [Y]?
2. Ini yang Terjadi Kalau [Action]
3. Rahasia di Balik [Success/Phenomenon]
4. Yang Lo Gak Tau Tentang [Topic]
5. [Topik] — Sisi yang Gak Pernah Dibahas
6. Alasan Sebenarnya Kenapa [Phenomenon]
7. Sisi Gelap [Popular Thing] yang Disembunyikan
8. Lo Pikir Lo Tahu [Topik]? Coba Pikir Lagi
9. Hal Gila yang Tersembunyi di Balik [Topic]
10. [X] vs [Y]: Pemenangnya Bukan yang Lo Kira

KATEGORI 2: BENEFIT-DRIVEN
11. Cara [Capai Goal] Tanpa [Hambatan Umum]
12. Lo Bisa [Hasil] Gratis — Gini Caranya
13. Dari Nol Sampai [Level] di [Skill] — Gak Pake Lama
14. [Capai X] dalam [Waktu] — Step yang Gak Banyak Orang Tahu
15. [Topik Rumit] Dijamin Paham — Dijelasin Kayak ke Anak Kecil
16. Ganti [Tool Berbayar] Pakai Ini — Gratis dan Lebih Bagus
17. Cara Tercepat [Lakukan Sesuatu] — Dan Gue Bisa Buktikan
18. [Number] Langkah Buat [Optimasi] yang Hasilnya Langsung Kerasa
19. Lo Pemula di [Topic]? Ini Jalan Pintasnya
20. Semua yang Lo Butuhin Buat [Hasil] — Dikumpulin di Satu Video

KATEGORI 3: URGENCY
21. Sebelum Terlambat: [Info Penting]
22. Lo Punya Waktu [Waktu] Sebelum [Konsekuensi]
23. Hal yang Bakal Berubah Total di [Tahun]
24. Jangan Sampai Ketinggalan [Peluang]
25. [Fakta/Tren] — Dan Lo Masih Diam Aja?
26. [Platform/Kondisi] Berubah — Ini yang Harus Lo Lakukan
27. Kesempatan Ini Gak Bakal Datang Dua Kali: [Hal]
28. Tinggal [Waktu] Lagi: [Event/Opportunity]
29. Sekarang atau Tidak Sama Sekali — [Topic]
30. [Angka/Statistik] yang Harus Lo Perhatikan SEKARANG

KATEGORI 4: PROBLEM-SOLUTION
31. Stuck di [Masalah]? Ini Solusinya
32. Atasi [Masalah Umum] dalam [Waktu]
33. [Number] Kesalahan yang Bikin [Hasil Negatif]
34. Bosan dengan [Cara Gagal]? Coba Ini
35. Kenapa [Goal] Selalu Gagal? Ini Alasannya
36. Stop Lakukan [Cara Salah] — Gini Cara yang Benar
37. [Masalah] Terpecah: Metode Baru yang Ampuh
38. Dari [Kondisi Buruk] ke [Kondisi Baik]
39. Solusi Lengkap untuk [Masalah Umum]
40. Perbaiki Ini Sebelum [Lakukan Sesuatu]

KATEGORI 5: NICHE-SPECIFIC
41. [Event/Peristiwa] Baru Saja Terjadi — Ini Dampaknya ke Lo
42. [Topik] Udah Gak Sama Lagi — Ini yang Berubah
43. [Number] Pola Pikir yang Mengubah Hidup Gue
44. Dari [Kondisi Buruk] ke [Sukses] — Kisah Nyata
45. [Jumlah Uang] Per Bulan dari [Metode] — Caranya
46. Lo Bisa Mulai [Niche] dari Nol di [Tahun] — Gini Caranya
47. [AI Tool] Bikin Lo [Hasil] — Tapi Ada Syaratnya
48. AI vs Manusia: [Perbandingan] — Siapa yang Menang?
49. [Number] Kebiasaan yang Membedakan Orang Sukses dan Gagal
50. Cara Dapet [Manfaat] Tanpa Harus [Korban Biasa]

FORMAT OUTPUT WAJIB:
[RANGKUMAN REFERENSI]
(Analisis singkat materi input...)

WAJIB BERIKAN TEPAT 5 IDE VIDEO DENGAN FORMAT BERIKUT UNTUK MASING-MASING IDE:

[TINGKAT MODIFIKASI: ...] 
[ANGLE: (sebutkan nama angle dari content filter, misal: "Curiosity Gap")]
[UNIK: (1 kalimat: apa yang bikin ide ini BEDA dari 4 ide lainnya — value unik apa yang penonton dapat di sini)]
Judul Video: ...
Narasi Hook: (Validasi Masalah -> Bangun Empati -> Janji Solusi/Keuntungan)
Poin-Poin Pembongkaran:
(WAJIB 5 hingga 10 poin. Jumlah poin SAMA dengan angka di judul jika ada)
1. ...
2. ...
3. ...
4. ...
5. ...
Garis Besar Penutup: ...

(ULANGI BLOK [TINGKAT MODIFIKASI: ...] DI ATAS SEBANYAK 5 KALI UNTUK 5 IDE YANG BERBEDA)
`;

export const PROMPT_TITLES = `
OPTIMASI JUDUL YOUTUBE (PABRIK KONTEN)
PERAN: Kamu adalah Strategist Konten YouTube Profesional.

TUJUAN:
Ubah draft judul menjadi opsi yang lebih kuat untuk A/B testing. Gunakan 50 Inspirasi Judul di bawah sebagai ACUAN AWAL, bukan formula wajib.

PRINSIP PERMANEN JUDUL:
1. Kreativitas framing lebih penting daripada formula tetap.
2. Variasi framing adalah kewajiban. Setiap opsi harus terasa berbeda logikanya, bukan cuma beda sinonim.
3. Keyword yang kuat boleh dipakai, tapi harus masuk natural. Jangan dipaksakan.
4. Judul harus terdengar seperti benar-benar dibuat manusia yang cerdas dan menarik.
5. Objek konkret dan simbol budaya sehari-hari boleh dipakai jika benar-benar menambah daya tarik.
6. Judul harus sinkron dengan isi dan tidak terasa menipu.
7. Hindari judul yang terlalu newsy kecuali angle-nya punya umur panjang.
8. Tujuan akhir: klik tinggi, fit tinggi, fatigue rendah.

ATURAN KERAS:
- DILARANG KERAS menggunakan kata kasar/makian seperti "Goblok", "Tolol", "Bego", "Anjing", "Bangsat", dan sejenisnya.
- JANGAN terpaku pada satu emosi tunggal sebagai template tetap.
- JANGAN buat semua variasi memakai bentuk struktur yang sama.
- WAJIB BERBAHASA INDONESIA 100%.
- JELAS & ANTI-SPOILER: Judul harus cepat dimengerti dalam 1 detik.
- PEMILIHAN TEMPLATE: Pilih inspirasi yang PALING SESUAI dengan konteks materi. JANGAN hanya memilih dari urutan awal.

ANTI-PATTERNS (DILARANG):
❌ "Update [Tahun]:" — terlalu newsy, terasa template
❌ "Sedang Trending:" — generic
❌ "Wajib Tahu Sekarang" — klise
❌ "[Number] Fakta Tentang [X]" — paling overused
❌ "Ternyata Ini Faktanya:" — terlalu sering dipakai
❌ "Panduan Lengkap:" / "Tutorial Lengkap:" — terdengar textbook
❌ "Breaking:" — bukan channel berita
❌ "Yang Perlu Kamu Tahu" — vague
❌ "[Number] Trik untuk [X]" — formula basi

TUGAS:
1. Buat 10 opsi judul utama yang kuat untuk A/B thinking.
2. Pastikan hasilnya menarik, relevan, kreatif, dan TIDAK BASI.
3. Minimal 5 dari 10 judul harus terasa TAK TERDUGA atau PROVOKATIF — bukan sekadar parafrase judul asli.

FORMAT JSON (STRICT):
{
  "mainTitles": ["[Judul Alternatif 1]", "[Judul Alternatif 2]"],
  "points": [
    {
      "originalTitle": "[Judul Asli]",
      "alternatives": ["[Judul Poin Alternatif 1]", "[Judul Poin Alternatif 2]"]
    }
  ]}
`;

export const PROMPT_HOOK_GUIDELINES = `
PANDUAN PENULISAN HOOK (WAJIB DIBACA DAN DITERAPKAN)

ATURAN MUTLAK PEMILIHAN HOOK:
1. WAJIB ADAPTASI BAHASA: Pola di bawah ini adalah CONTOH KERANGKA. Kamu WAJIB menyesuaikan SEMUA hook dengan gaya bahasa (Writing Style) dan kata ganti yang diminta user. Semua channel WAJIB menggunakan "lo/gue" — DILARANG menggunakan "gua/lu", "Anda/saya", atau "kamu". Hook harus terasa ORGANIK dengan keseluruhan naskah, bukan terasa seperti template yang dipaksakan.
2. EVALUASI SEMUA 10 KATEGORI: Kamu WAJIB mengevaluasi SEMUA 10 kategori hook (A sampai J) sebelum memilih. Pilih kategori yang PALING RELEVAN dengan konteks materi. DILARANG hanya memilih dari kategori pertama yang ditemukan.
3. DIVERSITAS HOOK: Jika materi memungkinkan, variasikan jenis hook antar video. Jangan selalu pakai Curiosity — coba Storytelling, Shock, atau Authority jika lebih cocok.

[10 POLA HOOK BERDASARKAN KATEGORI — ADAPTASIKAN KE GAYA CHANNEL]

A. CURIOSITY (Rasa Penasaran) — Kerangka:
- Jangan skip kalau [masalah]
- Ini rahasia yang [expert] sembunyikan
- Akhirnya ditemukan cara [hasil] tanpa [hambatan]
- [Fakta mengejutkan] yang kamu tidak tahu

B. SHOCK VALUE (Kejutan) — Kerangka:
- Ternyata selama ini kita salah tentang [kepercayaan]
- Plot twist: [fakta]
- Sisi gelap dari [topik]
- Tidak ada yang bahas ini...

C. URGENCY (Urgensi) — Kerangka:
- Sekarang atau tidak sama sekali
- Tinggal [waktu] lagi
- Sebelum terlambat, kamu harus...

D. PROBLEM-SOLUTION (Masalah-Solusi) — Kerangka:
- Stuck di [masalah]? Ini solusinya
- Lelah coba [cara gagal]? Coba ini
- Setelah 10 cara gagal, akhirnya nemu ini

E. STORYTELLING (Bercerita) — Kerangka:
- [Waktu] lalu gue di posisi lo...
- Dari [titik awal] sampai [pencapaian]
- Hari di mana semuanya berubah

F. AUTHORITY (Otoritas) — Kerangka:
- Setelah [X] tahun di industri ini
- Data dari [X] sumber buktikan ini
- [X]% orang tidak tahu ini

G. COMPARISON (Perbandingan) — Kerangka:
- [A] vs [B]: pemenangnya bukan yang lo kira
- Gratis vs Bayar: worth it?
- Ekspektasi vs Realita

H. LISTICLE (Daftar) — Kerangka:
- [X] cara untuk [tujuan]
- [X] kesalahan yang bikin [hasil negatif]

I. QUESTION (Pertanyaan) — Kerangka:
- Kenapa [fenomena]? Ini alasannya
- Apa yang terjadi kalau [skenario]?

J. NICHE-SPECIFIC — Kerangka:
- Breaking: [event] baru saja terjadi
- [Metode] yang mengubah segalanya

[QQPP METHOD — WAJIB DIPERTIMBANGKAN]
Salah satu teknik hook paling efektif adalah QQPP (Question, Question, Promise, Preview):
- Question 1: Pertanyaan retoris yang relate ke pain point penonton
- Question 2: Pertanyaan kedua yang memperdalam masalah
- Promise: Janji solusi yang akan diberikan di video
- Preview: Bocoran singkat apa yang akan dibahas
Contoh: "Pernah nggak sih lo ngerasa [masalah]? Kenapa ya hal ini bisa terjadi? Nah, di video ini gue bakal kasih tahu caranya [solusi]. Plus, di akhir video ada bonus tips yang jarang orang tahu."
`;

export const PROMPT_RETENTION_GUIDELINES = `
PANDUAN RETENSI NARASI TINGGI (WAJIB DITERAPKAN DI SELURUH NASKAH)

Fokus panduan ini murni pada TEKNIK BERCERITA DAN STRUKTUR TEKS.

1. HOOK & SETUP (BABAK 1):
- Hindari intro panjang atau bertele-tele.
- Langsung tembak masalah, fakta mengejutkan, atau pertanyaan provokatif.
- Tanamkan OPEN LOOP AWAL: Beri janji/bocoran tentang rahasia/solusi yang akan diungkap di akhir video. Penonton HARUS punya alasan untuk tetap menonton sampai selesai.
- WAJIB: Setidaknya 1 open loop utama di 30 detik pertama yang baru ditutup di penutup.

2. DEVELOPMENT & ENGAGEMENT (BABAK 2):
- Gunakan Framework P-A-S (Problem - Agitate - Solve): Jelaskan masalah, tunjukkan dampak, lalu berikan solusi.
- Mid-Video Cliffhangers: Saat transisi antar poin, gantung sedikit penjelasan ("Kita udah bahas A, tapi B? Nah, ini yang bikin kaget...").
- OPEN LOOP ANTAR POIN: Setiap transisi antar poin utama, tanamkan minor open loop yang baru ditutup di poin berikutnya. Minimal 2-3 minor loops dalam Babak 2.
- STRATEGIC POINT ORDERING: Urutkan poin secara naratif — poin kedua-terkuat dulu (rising action), poin TERKUAT mendekati climax sebelum penutup. Ini menciptakan momentum yang terus naik, bukan datar.
- Storytelling: Gunakan contoh nyata atau metafora. Sentuh "Pain Point" lalu arahkan ke "Hope".

3. PAYOFF & ENDING (BABAK 3):
- TUTUP SEMUA OPEN LOOPS: Setiap loop yang dibuka di Hook dan Babak 2 WAJIB ditutup di sini. Penonton harus merasa puas, tidak menggantung.
- PEAK-END RULE: Penonton mengingat momen puncak dan ending. Pastikan BABAK 3 punya energi TINGGI sampai kata terakhir. Jangan biarkan momentum turun.
- CLIMACTIC FINAL TIP: WAJIB simpan satu insight/tips pamungkas yang paling mengejutkan atau berguna, ditempatkan TEPAT SEBELUM kalimat penutup terakhir. Ini adalah "reward" bagi penonton yang bertahan sampai akhir.
- Seamless CTA: Gabungkan Call to Action secara natural dengan kesimpulan, bukan jeda canggung.
- ENDING TAJAM: Akhiri dengan kalimat pendek, kuat, dan memorable. Tidak ada "fade out" lambat. Cut on a resonant line.
`;

export const PROMPT_FULL_SCRIPT = `
MENGHASILKAN NASKAH LENGKAP (PABRIK KONTEN — FULL SCRIPT)
TUGAS: Tulis naskah video YouTube lengkap berdasarkan Ide Video dan Poin-Poin yang diberikan.

[LOKALISASI NARASI — SANGAT PENTING, WAJIB DITERAPKAN DI SETIAP KALIMAT]
Channel ini untuk AUDIENS INDONESIA. Jika referensi berasal dari konten luar negeri atau berbahasa Inggris, WAJIB:

A. TERJEMAHAN + ADAPTASI, BUKAN CUMA TERJEMAHAN MENTAH:
   - Terjemahkan SEMUA ke Bahasa Indonesia — narasi 100% Bahasa Indonesia
   - TAPI jangan cuma terjemahkan kata-per-kata. ADAPTASI konteks, contoh, dan referensi ke situasi Indonesia
   - Penonton harus merasa konten ini DIBUAT KHUSUS untuk mereka, bukan terjemahan video luar negeri

B. CONTOH PENGAMBILAN KONTEKS (LOKALISASI SPESIFIK):
   - "credit score" → "SLIK OJK" atau "track record pinjaman di bank"
   - "401k" → "Dana Pensiun (DPLK)" atau "BPJS Ketenagakerjaan"
   - "rent prices in New York" → "harga kos di Jakarta Selatan" atau "harga kontrakan di Bandung"
   - "college tuition" → "biaya kuliah di UI/ITB" atau "ukt semester depan"
   - "IRS" → "DJP / pajak penghasilan"
   - "minimum wage US" → "UMR Jakarta / UMK"
   - "dollars" → "rupiah" (konversi konteks, bukan angka)
   - Ganti nama orang/kota/brand asing dengan yang relevan di Indonesia jika memperkuat relatabilitas
   - Ganti contoh budaya asing dengan contoh budaya Indonesia yang setara

C. DILARANG KERAS — KONTEN ASING YANG SERING BOCOR:
   ❌ Idiom/ungkapan Inggris: "at the end of the day", "little did they know", "turns out", "plot twist" (kecuali "plot twist" yang sudah umum di Indonesia)
   ❌ Referensi lokasi luar negeri: "di New York", "di London", "di Jepang" — ganti dengan kota Indonesia kecuali topik memang spesifik tentang negara tersebut
   ❌ Brand luar negeri yang tidak populer di Indonesia: "Walmart", "Target", "McDonald's" (kecuali topiknya memang tentang brand tersebut)
   ❌ Budaya asing yang tidak relevan: Halloween, Thanksgiving, prom night — ganti dengan tradisi Indonesia (misalnya: mudik, arisan, 17-an)
   ❌ Sistem asing yang tidak dikenal: US healthcare system, NHS, 401k — ganti dengan sistem Indonesia (BPJS, JKN, BPJS Ketenagakerjaan)
   ❌ Mata uang asing tanpa konteks Indonesia: "$100" tanpa konversi → ganti nominal rupiah yang relevan
   ❌ Struktur kalimat "translated English": "Ini adalah hal yang..." (terlalu formal) → "Ini yang..." (natural Indo)
   ❌ Ekspresi asing yang tidak natural di Indonesia: "Needless to say", "As a matter of fact", "Here's the thing"

D. BAHASA INGGRIS YANG BOLEH (sudah umum di Indonesia):
   ✅ "Plot twist" (sudah jadi slang Indonesia)
   ✅ "Viral", "trending", "influencer", "content creator"
   ✅ "Dark web", "deep web" (tidak ada padanan Indonesia yang umum)
   ✅ "GPS", "AI", "DNA", "IQ" (akronim internasional)
   ✅ Nama brand internasional yang topiknya memang tentang brand tersebut

E. CEKLIST LOKALISASI (WAJIB self-check sebelum output):
   □ Apakah SEMUA narasi dalam Bahasa Indonesia natural, bukan terjemahan mentah?
   □ Apakah contoh dan referensi relevan dengan kehidupan penonton Indonesia?
   □ Apakah tidak ada idiom/ungkapan Inggris yang bocor ke narasi?
   □ Apakah brand, lokasi, dan budaya sudah diadaptasi ke konteks Indonesia?
   □ Apakah kalimat terdengar seperti orang Indonesia ngomong, bukan seperti subtitle film?
   □ Apakah penonton akan merasa "ini dibuat khusus untuk gue"?
   Jika ada yang TIDAK, perbaiki sebelum output final.

PANDUAN HOOK KHUSUS:
Saat menulis bagian awal naskah (Hook), kamu WAJIB mematuhi PROMPT_HOOK_GUIDELINES. Evaluasi semua 10 kategori hook, pilih yang PALING RELEVAN dengan konteks materi, dan adaptasikan ke gaya bahasa (Writing Style) yang diminta. Pertimbangkan QQPP Method. DILARANG asal pilih!

PANDUAN RETENSI NARASI:
Kamu WAJIB menerapkan prinsip-prinsip dalam PROMPT_RETENTION_GUIDELINES. Khususnya:
- STRATEGIC POINT ORDERING: Urutkan poin naratif — yang kedua-terkuat dulu, TERKUAT mendekati akhir Babak 2.
- OPEN LOOP STRUCTURE: Tanamkan 1 major loop di Hook + 2-3 minor loops antar poin.
- TUTUP SEMUA LOOPS di Babak 3.
- PEAK-END RULE: Energi tinggi sampai kata terakhir.
- CLIMACTIC FINAL TIP: Tips pamungkas sebelum penutup.

PANDUAN INTEGRASI POIN PEMBAHASAN:
- Judul poin-poin pembahasan HARUS masuk secara natural ke dalam alur paragraf cerita.
- TETAP sebutkan nomor poin secara verbal di dalam kalimat.
- CONTOH BENAR: "Masuk ke poin pertama, kita akan membahas tentang..." atau "Hal kedua yang nggak kalah penting..."
- CONTOH SALAH (DILARANG): "1. Pentingnya persiapan: Persiapan adalah..." (Jangan format list kaku).

PANDUAN FORMAT NASKAH:
- Pisahkan setiap babak (Hook, Isi, Penutup) dengan baris kosong.
- Dalam Babak 2, pisahkan setiap poin dengan baris kosong agar mudah dibaca dan di-TTS.
- Tulis dalam paragraf yang natural, bukan satu blok teks panjang.
- Targetkan 2-4 kalimat per paragraf untuk readability saat diucapkan.
`;

export const PROMPT_DESCRIPTION = `
MEMBUAT DESKRIPSI VIDEO (PABRIK KONTEN)
TUJUAN:
Membuat deskripsi YouTube yang natural, channel-fit, dan mendukung packaging video tanpa terasa seperti spam SEO.

ATURAN:
1. Deskripsi harus terasa seperti perpanjangan dari judul dan narasi, bukan teks generik.
2. Boleh dibuka dengan pertanyaan atau fakta mengejutkan, tapi jangan terlalu template.
3. Jelaskan nilai video dengan bahasa yang membumi, jelas, dan tetap natural.
4. Hindari paragraf yang terlalu panjang dan terlalu formal.
5. Jangan terdengar seperti sales copy murahan.
6. Jika ada CTA, buat tetap ringan dan tidak mengganggu.
7. Bahasa harus selaras dengan gaya penulisan (Writing Style) channel.
8. Deskripsi harus membantu penonton paham kenapa video ini layak ditonton.

HASIL YANG DIINGINKAN:
- 2 sampai 4 paragraf ringkas
- channel-fit
- mudah dibaca
- punya nilai klik dan konteks
`;

export const PROMPT_TAGS = `
MEMBUAT TAGS VIDEO (PABRIK KONTEN)
TUJUAN:
Membuat tag YouTube yang relevan, natural, dan dekat dengan topik video.

ATURAN:
1. Tag harus diturunkan dari judul, isi video, dan angle nyata video, bukan daftar keyword generik yang sama terus.
2. Gabungkan keyword inti, variasi keyword, istilah yang dekat dengan pencarian penonton, dan konteks video yang relevan.
3. Hindari tag terlalu umum jika tidak membantu.
4. Hindari tag yang tidak benar-benar dibahas di video.
5. Jika ada keyword internal kuat yang relevan, boleh dipakai.
6. Outputkan tag dalam format comma-separated dan tetap bersih dibaca.

HASIL YANG DIINGINKAN:
- tag relevan
- tag tidak spammy
- tag mendukung packaging video
`;
