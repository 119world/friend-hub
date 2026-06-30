export const defaultLocalStore = {
  partners: [
    {
      id: "partner_sonu119",
      type: "partner",
      name: "Ananya",
      age: 24,
      gender: "Woman",
      city: "Mumbai, India",
      location: "Mumbai, India",
      distanceKm: 2,
      lat: 19.076,
      lng: 72.8777,
      profession: "Product Designer",
      bio: "Warm, travel-loving profile for Friend Hub discovery. Admin can edit name, age, bio, photos, and videos anytime.",
      interests: ["Travel", "Coffee", "Music", "Hiking"],
      photos: [
        "https://images.unsplash.com/photo-1496440737103-cd596325d314?auto=format&fit=crop&w=900&q=85",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85",
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=85"
      ],
      videos: [],
      welcomeMessage: "Hey! How's your weekend going?",
      firstReply: "That sounds amazing. Tell me more.",
      secondReply: "I would be happy to continue this conversation.",
      freeReplyLimit: 1,
      delayMs: 650,
      online: true,
      verified: true,
      showInDiscovery: true,
      showInMatches: true,
      allowAutoContact: true,
      chatPrice: 9,
      voiceCallPrice: 19,
      active: true
    },
    {
      id: "partner_neha",
      type: "partner",
      name: "Neha",
      age: 25,
      gender: "Woman",
      city: "Delhi, India",
      location: "Delhi, India",
      distanceKm: 3,
      lat: 28.6139,
      lng: 77.209,
      profession: "Lifestyle Creator",
      bio: "Cafe hopping, movies, and friendly conversations. Admin can replace this with real partner media.",
      interests: ["Movies", "Photography", "Food", "Friendship"],
      photos: [
        "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=900&q=85",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85",
        "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=900&q=85"
      ],
      videos: [],
      welcomeMessage: "Hi, I just saw your profile.",
      firstReply: "You seem interesting.",
      secondReply: "Let's continue after recharge.",
      freeReplyLimit: 1,
      delayMs: 700,
      online: true,
      verified: true,
      showInDiscovery: true,
      showInMatches: true,
      allowAutoContact: true,
      chatPrice: 9,
      voiceCallPrice: 19,
      active: true
    }
  ],
  aiBots: [
    {
      id: "bot_sia",
      type: "bot",
      name: "Sia AI",
      age: 23,
      gender: "Woman",
      city: "Bangalore, India",
      location: "Bangalore, India",
      distanceKm: 5,
      lat: 12.9716,
      lng: 77.5946,
      bio: "Friendly AI community assistant for quick replies, welcome messages, and recharge-gated chat flow.",
      personality: "Warm, playful, supportive",
      personalityConfig: {
        tone: "friendly",
        replyStyle: "short",
        rechargeAfterFreeReplies: true
      },
      photos: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
        "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=900&q=85",
        "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=900&q=85"
      ],
      galleryPhotos: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
        "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=900&q=85",
        "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=900&q=85"
      ],
      videos: [],
      welcomeMessage: "Hey, I am online now.",
      firstReply: "Tell me what kind of friend you are looking for.",
      secondReply: "Recharge to continue this community chat.",
      freeReplyLimit: 1,
      delayMs: 600,
      online: true,
      verified: true,
      showInDiscovery: true,
      showInMatches: true,
      allowAutoContact: true,
      active: true
    }
  ],
  plans: [
    { id: "first_9", title: "First-time Offer", originalPrice: 19, price: 9, diamonds: 30, minutes: 1, active: true, subscription: false, autoPay: true, autoPayAmount: 9 },
    { id: "normal_19", title: "Starter", originalPrice: 19, price: 19, diamonds: 50, minutes: 1, active: true, subscription: false, autoPay: true, autoPayAmount: 19 },
    { id: "offer_49", title: "Friend Offer", originalPrice: 99, price: 49, diamonds: 160, minutes: 4, active: true, subscription: false, autoPay: true, autoPayAmount: 49 },
    { id: "premium_99", title: "Premium Offer", originalPrice: 199, price: 99, diamonds: 360, minutes: 10, active: true, subscription: true, autoPay: true, autoPayAmount: 99, renewEveryDays: 30 }
  ],
  replyTemplates: [
    {
      id: "default",
      welcomeMessage: "Hey! How's your weekend going?",
      firstReply: "That sounds amazing! I love this vibe.",
      secondReply: "Recharge to continue this conversation.",
      keywords: ["hi", "hello", "hey"],
      delayMs: 650,
      replyLimit: 1,
      limitReachedMessage: "You have used the free chat preview.",
      rechargeMessage: "Recharge diamonds to continue chatting.",
      voiceCallLockedMessage: "Recharge diamonds to unlock audio and video calls."
    }
  ],
  appSettings: [
    {
      id: "welcome",
      title: "Meet New Friends. Build Real Connections.",
      subtitle: "Friend Hub is a social networking platform where users can discover people, chat safely, and build interest-based friendships.",
      bgPhoto: "https://kommodo.ai/i/No7wWQG0HvqP46BLcpnL",
      maintenanceMode: false,
      maintenanceTitle: "Friend Hub is updating",
      maintenanceMessage: "We are polishing the app. Please check again in a few minutes.",
      maintenanceActionLabel: "",
      maintenanceActionUrl: "",
      active: true
    }
  ],
  referralRules: [
    { id: "ref_5", requiredReferrals: 5, bonusDiamonds: 25, title: "5 friends bonus", active: true },
    { id: "ref_10", requiredReferrals: 10, bonusDiamonds: 75, title: "10 friends bonus", active: true }
  ]
};
