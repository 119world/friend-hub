export const sampleProfiles = [
  {
    id: "partner_priya",
    type: "partner",
    name: "Priya",
    age: 24,
    city: "Mumbai, India",
    location: "2 km away",
    distanceKm: 2,
    profession: "Product Designer",
    rating: 4.9,
    bio: "Love design, coffee, long walks and meaningful conversations.",
    interests: ["Travel", "Coffee", "Design", "Music"],
    online: true,
    verified: true,
    photos: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1496440737103-cd596325d314?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1524638431109-93d95c968f03?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1488716820095-cbe80883c496?auto=format&fit=crop&w=900&q=88"
    ],
    videos: [],
    welcomeMessage: "Hey! How's your weekend going?",
    chatPrice: 5,
    voiceCallPrice: 20,
    active: true
  },
  {
    id: "bot_ananya",
    type: "bot",
    name: "Ananya",
    age: 23,
    city: "Delhi, India",
    location: "3 km away",
    distanceKm: 3,
    profession: "AI Companion",
    rating: 4.8,
    bio: "Warm AI friend for relaxed chats.",
    interests: ["Hiking", "Movies", "Food", "Books"],
    online: true,
    verified: true,
    personalityConfig: {
      tone: "warm",
      style: "friendly",
      rechargeTriggerAfterReplies: 2
    },
    photos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=900&q=88"
    ],
    galleryPhotos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=88"
    ],
    videos: [],
    welcomeMessage: "Hey! How's your weekend going?",
    firstReply: "That sounds amazing! I love hiking too.",
    secondReply: "Definitely! I'd love that.",
    freeReplyLimit: 2,
    active: true
  },
  {
    id: "partner_neha",
    type: "partner",
    name: "Neha",
    age: 25,
    city: "Bangalore, India",
    location: "5 km away",
    distanceKm: 5,
    profession: "Photographer",
    rating: 4.7,
    bio: "Travel, cafes, portraits and easy conversations.",
    interests: ["Photography", "Travel", "Cafe"],
    online: true,
    verified: true,
    photos: [
      "https://images.unsplash.com/photo-1524638431109-93d95c968f03?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1512310604669-443f26c35f52?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=88"
    ],
    videos: [],
    welcomeMessage: "Let's plan for coffee sometime.",
    chatPrice: 5,
    voiceCallPrice: 20,
    active: true
  },
  {
    id: "partner_rohan",
    type: "partner",
    name: "Rohan",
    age: 27,
    city: "Pune, India",
    location: "8 km away",
    distanceKm: 8,
    profession: "Marketing Lead",
    rating: 4.6,
    bio: "Weekend trips, music and calm conversations.",
    interests: ["Travel", "Music", "Fitness"],
    online: false,
    verified: true,
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=88"
    ],
    videos: [],
    welcomeMessage: "That sounds great!",
    chatPrice: 5,
    voiceCallPrice: 20,
    active: true
  }
];

export const sampleThreads = [
  { id: "local_ananya", name: "Ananya", photo: sampleProfiles[1].photos[0], preview: "Hey! How's your weekend going?", time: "12:30 PM", unread: 2 },
  { id: "local_rohan", name: "Rohan", photo: sampleProfiles[3].photos[0], preview: "That sounds great!", time: "11:15 AM", unread: 1 },
  { id: "local_neha", name: "Neha", photo: sampleProfiles[2].photos[0], preview: "Let's plan for a coffee sometime.", time: "Yesterday", unread: 0 },
  { id: "local_priya", name: "Priya", photo: sampleProfiles[0].photos[0], preview: "Loved your travel photos!", time: "2 days ago", unread: 0 }
];

export const localConversation = [
  { id: "m1", senderType: "partner", text: "Hey! How's your weekend going?", time: "12:30 PM" },
  { id: "m2", senderType: "user", text: "It's been great! Went hiking yesterday.", time: "12:32 PM" },
  { id: "m3", senderType: "partner", text: "That sounds amazing! I love hiking too.", time: "12:33 PM" },
  { id: "m4", senderType: "user", text: "Let's plan a hike together sometime!", time: "12:34 PM" },
  { id: "m5", senderType: "partner", text: "Definitely! I'd love that.", time: "12:35 PM" }
];
