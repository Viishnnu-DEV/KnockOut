import { Filter } from 'bad-words';

const filter = new Filter();

// Add some custom bad words or football specific slurs if needed
// filter.addWords('someWord');

const adjectives = [
  "Samba", "Golden", "Nutmeg", "Flying", "Magic", "Super", "Wonder", 
  "Deadly", "Clinical", "Maverick", "Shadow", "Thunder", "Atomic"
];

const nouns = [
  "Striker", "Winger", "Keeper", "Playmaker", "Defender", "Captain", 
  "Scorer", "Finisher", "Tackler", "Dribbler", "Sweeper", "Coach"
];

const flags = ["🇧🇷", "🇦🇷", "🇫🇷", "🇪🇸", "🇩🇪", "🇮🇹", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🇵🇹", "🇳🇱", "🇧🇪", "🇺🇾", "🇭🇷", "🇲🇦", "🇯🇵", "🇺🇸", "🇲🇽", "🇨🇴"];

export function getUserChatIdentity() {
  let identity = localStorage.getItem('kickoff_chat_identity');
  
  if (identity) {
    try {
      return JSON.parse(identity);
    } catch (e) {
      // If parsing fails, generate a new one
    }
  }

  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNum = Math.floor(Math.random() * 99) + 1;
  const randomFlag = flags[Math.floor(Math.random() * flags.length)];

  const newIdentity = {
    nickname: `${randomAdj}_${randomNoun}${randomNum}`,
    flag: randomFlag
  };

  localStorage.setItem('kickoff_chat_identity', JSON.stringify(newIdentity));
  return newIdentity;
}

export function cleanMessage(text) {
  try {
    return filter.clean(text);
  } catch (err) {
    // Fallback if filter crashes for some reason
    return text;
  }
}
