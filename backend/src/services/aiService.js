const ANALYSIS_TEMPLATES = {
  O: { // Deneyime Açıklık
    low: {
      summary: "Geleneksel yöntemleri ve alışılmış rutinleri tercih eden, pratik ve sonuç odaklı bir yaklaşımı vardır.",
      strengths: ["Pratik uygulama", "İstikrar", "Gerçekçi bakış açısı"],
      weaknesses: ["Değişime direnç", "Yaratıcılıkta tutukluk"],
      work_style: "Belirlenmiş prosedürler dahilinde çalışmayı tercih eder.",
      stress_behavior: "Belirsizlik durumlarında kaygı seviyesi artabilir.",
      recommendations: ["Net talimatlar verilmeli", "Değişim süreçlerinde zaman tanınmalı"]
    },
    medium: {
      summary: "Yeniliklere açık olmakla birlikte, denenen ve onaylanan yöntemlerin güvenliğine de önem verir.",
      strengths: ["Dengeli yaklaşım", "Uyumluluk", "Öğrenmeye isteklilik"],
      weaknesses: ["Bazen kararsızlık", "Konfor alanından çıkmakta temkinli olma"],
      work_style: "Hem rutin hem de yeni projelerde görev alabilir.",
      stress_behavior: "Değişim hızına göre adaptasyon süreci değişebilir.",
      recommendations: ["Sorumluluk alanı yavaşça genişletilmeli", "Geri bildirimle desteklenmeli"]
    },
    high: {
      summary: "Yüksek merak duygusuna sahip, yaratıcı, vizyoner ve yeni deneyimlere oldukça açık bir profildir.",
      strengths: ["Yaratıcı problem çözme", "Stratejik düşünme", "Hızlı adaptasyon"],
      weaknesses: ["Rutinden çabuk sıkılma", "Detayları gözden kaçırma"],
      work_style: "Yenilikçi ve keşif odaklı projelerde çok verimlidir.",
      stress_behavior: "Kısıtlandığını hissettiğinde motivasyonu düşebilir.",
      recommendations: ["Yaratıcı projelerde görev verilmeli", "Öğrenme fırsatları sunulmalı"]
    }
  },
  C: { // Sorumluluk
    low: {
      summary: "Daha esnek ve spontane çalışmayı seven, bazen detayları ve planları esnetebilen bir yapısı vardır.",
      strengths: ["Esneklik", "Hızlı kararlar", "Baskı altında rahatlık"],
      weaknesses: ["Düzensizlik", "Zaman yönetimi sorunları"],
      work_style: "Sıkı kurallar yerine esnek çalışma ortamlarını tercih eder.",
      stress_behavior: "Detay gerektiren işlerde stres yaşayabilir.",
      recommendations: ["Zaman yönetimi desteği verilmeli", "Kısa vadeli hedefler konulmalı"]
    },
    medium: {
      summary: "Genellikle düzenli ve sorumluluk sahibi olsa da, duruma göre esneklik gösterebilir.",
      strengths: ["Güvenilirlik", "Denge", "Yeterli organizasyon"],
      weaknesses: ["Bazen odak kaybı", "Aşırı yüklenmede verim düşüşü"],
      work_style: "Planlı çalışmaya gayret eder ancak ani değişikliklere uyum sağlar.",
      stress_behavior: "Belirsiz sorumluluklarda stres hissedebilir.",
      recommendations: ["Görev tanımları netleştirilmeli", "Önceliklendirme eğitimi verilmeli"]
    },
    high: {
      summary: "Disiplinli, düzenli ve hedeflerine odaklı, yüksek sorumluluk bilincine sahip bir çalışma prensibi vardır.",
      strengths: ["Yüksek disiplin", "Mükemmel organizasyon", "Güvenilirlik"],
      weaknesses: ["Aşırı mükemmeliyetçilik", "Esneklik eksikliği"],
      work_style: "Son derece sistematik ve sonuç odaklı çalışır.",
      stress_behavior: "Planların aksaması durumunda yüksek stres yaşar.",
      recommendations: ["Kritik ve detay gerektiren işler verilmeli", "Liderlik potansiyeli değerlendirilmeli"]
    }
  },
  E: { // Dışadönüklük
    low: {
      summary: "Daha içe dönük, sakin ve derinlemesine çalışmayı tercih eden, sosyal enerjisini tasarruflu kullanan bir yapıdadır.",
      strengths: ["Derin odaklanma", "Dinleme becerisi", "Sakinlik"],
      weaknesses: ["Sosyal ortamlarda çekingenlik", "İletişim eksikliği"],
      work_style: "Yalnız veya küçük gruplarla çalışırken daha verimlidir.",
      stress_behavior: "Kalabalık ve gürültülü ortamlarda çabuk yorulur.",
      recommendations: ["Odaklanma gerektiren işler verilmeli", "Yazılı iletişim teşvik edilmeli"]
    },
    medium: {
      summary: "Sosyal ortamlarda rahat olmakla birlikte, kendi başına çalışmaya ve düşünmeye de ihtiyaç duyar.",
      strengths: ["Dengeli iletişim", "Seçici sosyallik", "Uyum"],
      weaknesses: ["Bazen pasif kalma", "İletişimde ortalama performans"],
      work_style: "Hem bireysel hem de ekip çalışmalarında uyum sağlar.",
      stress_behavior: "Uzun süreli sosyal izolasyonda veya aşırı kalabalıkta dengesi bozulabilir.",
      recommendations: ["Farklı ekiplerle çalıştırılmalı", "Sunum becerileri geliştirilmeli"]
    },
    high: {
      summary: "Sosyal, enerjik, iletişim odaklı ve dış dünyayla etkileşime girmeyi seven bir profildir.",
      strengths: ["Güçlü iletişim", "İkna kabiliyeti", "Ekip motivasyonu"],
      weaknesses: ["Yalnız çalışırken sıkılma", "Aşırı konuşma eğilimi"],
      work_style: "İnsan etkileşimi ve ağ kurma gerektiren işlerde çok başarılıdır.",
      stress_behavior: "İlgisiz kalındığında veya sessiz ortamlarda enerjisi düşer.",
      recommendations: ["Satış, temsil veya liderlik rollerine yönlendirilmeli", "Grup projelerinde yer almalı"]
    }
  },
  A: { // Uyumluluk
    low: {
      summary: "Rekabetçi, eleştirel düşünen ve bağımsız karar alma eğilimi yüksek, sorgulayıcı bir yapıdadır.",
      strengths: ["Eleştirel analiz", "Bağımsızlık", "Rekabetçilik"],
      weaknesses: ["Çatışma eğilimi", "Empati eksikliği"],
      work_style: "Zorlu kararlar ve rekabet gerektiren ortamlarda etkilidir.",
      stress_behavior: "Grup baskısı altında agresifleşebilir.",
      recommendations: ["Analitik ve sorgulama gerektiren roller verilmeli", "Ekip çalışması eğitimleri almalı"]
    },
    medium: {
      summary: "Genellikle uyumlu ve iş birliğine açık olsa da, gerektiğinde kendi fikirlerini savunmaktan çekinmez.",
      strengths: ["İş birliği", "Adalet duygusu", "Makul yaklaşım"],
      weaknesses: ["Bazen hayır diyememe", "Çatışmadan kaçınma eğilimi"],
      work_style: "Ekip içinde uyumlu bir köprü görevi görür.",
      stress_behavior: "Gergin ortamlarda huzursuz olur.",
      recommendations: ["Arabuluculuk gerektiren işlerde değerlendirilmeli", "Girişkenlik becerileri desteklenmeli"]
    },
    high: {
      summary: "Yardımsever, nazik, iş birliğine son derece açık ve empati yeteneği gelişmiş bir karakter sergiler.",
      strengths: ["Yüksek empati", "Ekip uyumu", "Güven oluşturma"],
      weaknesses: ["Aşırı fedakarlık", "Eleştiri yapmakta zorlanma"],
      work_style: "Destekleyici ve hizmet odaklı bir çalışma tarzı vardır.",
      stress_behavior: "Başkalarının mutsuzluğu onu doğrudan etkiler.",
      recommendations: ["Müşteri ilişkileri veya İK rollerine uygun", "Takım liderliği potansiyeli yüksektir"]
    }
  },
  N: { // Duygusal Denge
    low: {
      summary: "Duygusal tepkileri yüksek, kaygılı ve hassas bir yapısı olabilir; stresli durumlardan kolay etkilenebilir.",
      strengths: ["Hassasiyet", "Detaylara duyarlılık", "Önceden riskleri görme"],
      weaknesses: ["Düşük stres toleransı", "Özgüven dalgalanmaları"],
      work_style: "Güvenli ve destekleyici ortamlarda daha iyi performans gösterir.",
      stress_behavior: "Baskı altında panikleyebilir veya geri çekilebilir.",
      recommendations: ["Pozitif geri bildirim verilmeli", "Stres yönetimi desteği sağlanmalı"]
    },
    medium: {
      summary: "Genel olarak duygusal dengesini korur ancak çok yüksek baskı altında stres hissedebilir.",
      strengths: ["Dengeli tepkiler", "Gerçekçilik", "Dayanıklılık"],
      weaknesses: ["Bazen motivasyon kaybı", "Baskı altında yorulma"],
      work_style: "Standart iş koşullarında stabil bir performans sergiler.",
      stress_behavior: "Sürekli kriz durumlarında yorgunluk hissedebilir.",
      recommendations: ["Baskı altında çalışma becerileri izlenmeli", "Zaman zaman dinlenme fırsatı verilmeli"]
    },
    high: {
      summary: "Stres altında dahi sakin kalabilen, duygusal olarak dayanıklı, soğukkanlı ve dengeli bir profildir.",
      strengths: ["Yüksek stres toleransı", "Soğukkanlılık", "Duygusal direnç"],
      weaknesses: ["Bazen aşırı tepkisizlik", "Başkalarının duygularına mesafeli kalma"],
      work_style: "Kriz anlarında ve yüksek baskılı işlerde mükemmel çalışır.",
      stress_behavior: "En zor anlarda bile mantıklı kararlar alabilir.",
      recommendations: ["Kriz yönetimi gerektiren işler verilmeli", "Yüksek sorumluluklu pozisyonlara getirilmeli"]
    }
  }
};

export async function analyzePersonality(name, age, scores, position, department) {
  try {
    const combinedAnalysis = {
      summary: '',
      strengths: [],
      weaknesses: [],
      work_style: '',
      stress_behavior: '',
      recommendations: []
    };

    const traits = ['O', 'C', 'E', 'A', 'N'];

    for (const traitCode of traits) {
      const score = scores[traitCode];
      
      // Seviye belirleme (0-30: Düşük, 31-70: Orta, 71-100: Yüksek)
      let level = 'medium';
      if (score >= 70) level = 'high';
      else if (score <= 30) level = 'low';

      const template = ANALYSIS_TEMPLATES[traitCode][level];

      if (template) {
        combinedAnalysis.summary += `${template.summary} `;
        combinedAnalysis.strengths.push(...(template.strengths || []));
        combinedAnalysis.weaknesses.push(...(template.weaknesses || []));
        
        // İş tarzı ve stres davranışını en baskın veya son trait'ten alabiliriz (veya birleştiririz)
        // Burada basitlik için trait'ler ilerledikçe güncelliyoruz
        if (template.work_style) combinedAnalysis.work_style = template.work_style;
        if (template.stress_behavior) combinedAnalysis.stress_behavior = template.stress_behavior;
        
        combinedAnalysis.recommendations.push(...(template.recommendations || []));
      }
    }

    // Tekrar edenleri temizle ve sınırla
    combinedAnalysis.strengths = [...new Set(combinedAnalysis.strengths)].slice(0, 5);
    combinedAnalysis.weaknesses = [...new Set(combinedAnalysis.weaknesses)].slice(0, 5);
    combinedAnalysis.recommendations = [...new Set(combinedAnalysis.recommendations)].slice(0, 5);

    return combinedAnalysis;
  } catch (error) {
    logger.error('Personality Analysis Error:', error);
    return {
      summary: 'Analiz oluşturulurken bir teknik aksaklık yaşandı.',
      strengths: ['Veri alınamadı'],
      weaknesses: ['Veri alınamadı'],
      work_style: 'Bilinmiyor',
      stress_behavior: 'Bilinmiyor',
      recommendations: ['Lütfen daha sonra tekrar deneyiniz.']
    };
  }
}
