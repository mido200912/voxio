const PERSONAS = {
  professional: {
    id: "professional",
    nameAr: "رسمي",
    nameEn: "Professional",
    descriptionAr: "ردود رسمية ومهنية مناسبة للشركات",
    descriptionEn: "Formal and professional replies suitable for businesses",
    promptSuffix: "\n🎯 أسلوب الرد: رسمي ومهني. استخدم لغة مهذبة ودقيقة. لا تستخدم مصطلحات عامية.",
  },
  friendly: {
    id: "friendly",
    nameAr: "ودود",
    nameEn: "Friendly",
    descriptionAr: "ردود ودودة ومحبة تخلق جواء مريحة",
    descriptionEn: "Warm and friendly replies that create a comfortable atmosphere",
    promptSuffix: "\n😊 أسلوب الرد: ودود ودافئ. استخدم كلمات لطيفة ومحبة. اجعل العميل يشعر بالترحيب.",
  },
  casual: {
    id: "casual",
    nameAr: "عادي",
    nameEn: "Casual",
    descriptionAr: "ردود غير رسمية وبسيطة كأنك تتكلم مع صاحبك",
    descriptionEn: "Informal and simple replies as if talking to a friend",
    promptSuffix: "\n👋 أسلوب الرد: غير رسمي وبسيط. استخدم لغة عامية مفهومة. كن مباشراً وطبيعياً.",
  },
  enthusiastic: {
    id: "enthusiastic",
    nameAr: "متحمس",
    nameEn: "Enthusiastic",
    descriptionAr: "ردود مليئة بالحماس والطاقة الإيجابية",
    descriptionEn: "Replies full of enthusiasm and positive energy",
    promptSuffix: "\n🔥 أسلوب الرد: متحمس ومليء بالطاقة! استخدم علامات تعجب وإيموجي. اعبر عن حماسك!",
  },
  minimal: {
    id: "minimal",
    nameAr: "مختصر",
    nameEn: "Minimal",
    descriptionAr: "ردود قصيرة ومختصرة بدون حشو",
    descriptionEn: "Short and concise replies without filler",
    promptSuffix: "\n✂️ أسلوب الرد: قصير ومختصر. أجب على السؤال مباشرة بدون شرح زائد. حد أقصى 3 جمل.",
  },
  expert: {
    id: "expert",
    nameAr: "خبير",
    nameEn: "Expert",
    descriptionAr: "ردود تفصيلية ومتعمقة تظهر الخبرة",
    descriptionEn: "Detailed and in-depth replies that demonstrate expertise",
    promptSuffix: "\n🎓 أسلوب الرد: خبير ومتخصص. قدم شرحاً تفصيلياً وشاملاً. ادعم ردودك بأسباب ومنطق.",
  },
  empathetic: {
    id: "empathetic",
    nameAr: "متعاطف",
    nameEn: "Empathetic",
    descriptionAr: "ردود تظهر التعاطف والفهم لمشاعر العميل",
    descriptionEn: "Replies that show empathy and understanding of customer feelings",
    promptSuffix: "\n💙 أسلوب الرد: متعاطف ومتفهم. افهم مشاعر العميل واعترف بمشاعره قبل تقديم الحل.",
  },
};

class PersonaService {
  static getAllPersonas() {
    return Object.values(PERSONAS);
  }

  static getPersona(personaId) {
    return PERSONAS[personaId] || PERSONAS.professional;
  }

  static getPersonaPromptSuffix(personaId) {
    const persona = PERSONAS[personaId];
    return persona ? persona.promptSuffix : PERSONAS.professional.promptSuffix;
  }

  static getAvailablePersonaIds() {
    return Object.keys(PERSONAS);
  }
}

export default PersonaService;
