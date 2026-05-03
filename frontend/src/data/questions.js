export const questions = [
  // Dışadönüklük (E) — 1-10, ters: 10
  { id: 1,  text: 'İnsanlarla kolay iletişim kurarım.',            factor: 'E', reverse: false },
  { id: 2,  text: 'Topluluk içinde kendimi rahat hissederim.',     factor: 'E', reverse: false },
  { id: 3,  text: 'Yeni insanlarla tanışmaktan zevk alırım.',     factor: 'E', reverse: false },
  { id: 4,  text: 'Grup aktivitelerine katılmayı severim.',       factor: 'E', reverse: false },
  { id: 5,  text: 'Enerjik ve canlı biri olduğumu düşünürüm.',    factor: 'E', reverse: false },
  { id: 6,  text: 'Sohbet başlatmakta güçlük çekerim.',           factor: 'E', reverse: false },
  { id: 7,  text: 'Yalnız kalmayı tercih ederim.',                factor: 'E', reverse: false },
  { id: 8,  text: 'Sessiz ve sakin ortamları tercih ederim.',     factor: 'E', reverse: false },
  { id: 9,  text: 'Sosyal etkinliklere katılmaktan kaçınırım.',   factor: 'E', reverse: false },
  { id: 10, text: 'Çok fazla konuşmam.',                          factor: 'E', reverse: true  },

  // Uyumluluk (A) — 11-20, ters: 20
  { id: 11, text: 'İnsanlara yardım etmeyi severim.',             factor: 'A', reverse: false },
  { id: 12, text: 'Başkalarının duygularını anlayabilirim.',      factor: 'A', reverse: false },
  { id: 13, text: 'Ekip çalışmasına katkıda bulunmayı severim.', factor: 'A', reverse: false },
  { id: 14, text: 'Uzlaşmacı bir yapım vardır.',                  factor: 'A', reverse: false },
  { id: 15, text: 'İnsanlara kolayca güvenirim.',                 factor: 'A', reverse: false },
  { id: 16, text: 'Başkalarına karşı şüpheci davranırım.',       factor: 'A', reverse: false },
  { id: 17, text: 'İş birliğinden çok rekabeti tercih ederim.',  factor: 'A', reverse: false },
  { id: 18, text: 'Başkalarının sorunları beni pek ilgilendirmez.', factor: 'A', reverse: false },
  { id: 19, text: 'Çatışmadan kaçınmam, tartışmayı severim.',    factor: 'A', reverse: false },
  { id: 20, text: 'Kolay sinirlenirim.',                          factor: 'A', reverse: true  },

  // Sorumluluk (C) — 21-30, ters: 30
  { id: 21, text: 'İşleri zamanında bitiririm.',                  factor: 'C', reverse: false },
  { id: 22, text: 'Düzenli ve organize biri olduğumu düşünürüm.', factor: 'C', reverse: false },
  { id: 23, text: 'Detaylara dikkat ederim.',                     factor: 'C', reverse: false },
  { id: 24, text: 'Planlarıma sadık kalırım.',                    factor: 'C', reverse: false },
  { id: 25, text: 'İş kurallarına uymak benim için önemlidir.',   factor: 'C', reverse: false },
  { id: 26, text: 'Ertelemeyi severim.',                          factor: 'C', reverse: false },
  { id: 27, text: 'Dağınık ve düzensiz bir çalışma ortamım olur.', factor: 'C', reverse: false },
  { id: 28, text: 'Teslim tarihlerini kaçırırım.',                factor: 'C', reverse: false },
  { id: 29, text: 'İşleri son dakikaya bırakırım.',               factor: 'C', reverse: false },
  { id: 30, text: 'Kurallara uymakta güçlük çekerim.',            factor: 'C', reverse: true  },

  // Duygusal Denge (N) — 31-40, ters: 40
  { id: 31, text: 'Stres altında sakin kalırım.',                 factor: 'N', reverse: false },
  { id: 32, text: 'Duygusal dengemi kolayca koruyabilirim.',      factor: 'N', reverse: false },
  { id: 33, text: 'Zorlu durumlarda sükûnetimi muhafaza ederim.', factor: 'N', reverse: false },
  { id: 34, text: 'Eleştirilerle yapıcı şekilde başa çıkarım.',  factor: 'N', reverse: false },
  { id: 35, text: 'İş baskılarını yönetmekte başarılıyım.',      factor: 'N', reverse: false },
  { id: 36, text: 'Sık stres yaşarım.',                           factor: 'N', reverse: false },
  { id: 37, text: 'Kaygılı ve endişeli biri olduğumu düşünürüm.', factor: 'N', reverse: false },
  { id: 38, text: 'Küçük şeyler beni kolayca rahatsız eder.',     factor: 'N', reverse: false },
  { id: 39, text: 'Duygusal olarak dengesiz hissederim.',         factor: 'N', reverse: false },
  { id: 40, text: 'Zorlu anlarda paniğe kapılırım.',              factor: 'N', reverse: true  },

  // Deneyime Açıklık (O) — 41-50, ters: 50
  { id: 41, text: 'Yeni şeyler öğrenmeyi severim.',               factor: 'O', reverse: false },
  { id: 42, text: 'Yaratıcı çözümler bulmaktan zevk alırım.',    factor: 'O', reverse: false },
  { id: 43, text: 'Farklı bakış açılarına açığım.',               factor: 'O', reverse: false },
  { id: 44, text: 'Değişime uyum sağlamak benim için kolaydır.',  factor: 'O', reverse: false },
  { id: 45, text: 'Meraklı ve araştırmacı bir yapım var.',        factor: 'O', reverse: false },
  { id: 46, text: 'Rutin ve alışılmış işleri tercih ederim.',     factor: 'O', reverse: false },
  { id: 47, text: 'Değişime direnç gösteririm.',                  factor: 'O', reverse: false },
  { id: 48, text: 'Yeni fikirler beni tedirgin eder.',            factor: 'O', reverse: false },
  { id: 49, text: 'Alışılmış yöntemlerden şaşmamayı tercih ederim.', factor: 'O', reverse: false },
  { id: 50, text: 'Hayal gücüm oldukça sınırlıdır.',              factor: 'O', reverse: true  },
];

export const factorLabels = {
  E: 'Dışadönüklük',
  A: 'Uyumluluk',
  C: 'Sorumluluk',
  N: 'Duygusal Denge',
  O: 'Deneyime Açıklık',
};

export const likertScale = [
  { value: 1, label: 'Kesinlikle\nKatılmıyorum' },
  { value: 2, label: 'Katılmıyorum' },
  { value: 3, label: 'Kararsızım' },
  { value: 4, label: 'Katılıyorum' },
  { value: 5, label: 'Kesinlikle\nKatılıyorum' },
];
