export const CHAPTER_THREE_GAIDEN_TITLE = { chapter: "Chapter 3", subtitle: "Gaiden" };

export const CHAPTER_THREE_GAIDEN_OPENING = [
  {
    type: "title",
    chapter: CHAPTER_THREE_GAIDEN_TITLE.chapter,
    subtitle: CHAPTER_THREE_GAIDEN_TITLE.subtitle,
    tag: "",
  },
  {
    type: "scene",
    sceneName: "Unmarked Road",
    background: "chapter3TipenWhippetMainRoadScene",
    lines: [
      {
        speaker: "Leon",
        portrait: "leonPortrait",
        text: "Really?  How rich is this Caleb guy? He's built a freakin' military grade supply bunker on the outskirts of a sleepy village and NO ONE knew? Bagsy not going down the ladder first.",
      },
    ],
  },
];

export const CHAPTER_THREE_GAIDEN_BATTLE_START_DIALOGUE = [
  {
    speaker: "Harold",
    portrait: "haroldPortrait",
    text: "Damned cowards, guess I'm in charge now all the important people have run away from these...kids. BOYS GRAB WHAT YOU CAN AND WE'LL REGROUP ELSEWHERE!",
  },
];

export const CHAPTER_THREE_GAIDEN_MARNIE_ENTRANCE_DIALOGUE = {
  speaker: "Marnie",
  portrait: "marniePortrait",
  text: "Glad I was watching this place. Time to make a pretty penny.",
};

export const CHAPTER_THREE_GAIDEN_POST_BATTLE_SCENE = [
  {
    type: "mapDialogue",
    speaker: "Heath",
    portrait: "heathPortrait",
    text: "We best get back to the farm.",
  },
  { type: "savePrompt", title: "Chapter 3: Gaiden Complete", text: "Save game?" },
];
