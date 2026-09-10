import type {
  VocabularyChapter,
  VocabularyWord,
} from '@shared/api.interface';

import generatedVocabulary from './vocabulary.generated.json';

const CHAPTER_SUBTITLES: string[] = [
  '地球结构、气候与自然现象',
  '植物生长、农业与生态环境',
  '动物种类、行为与保护议题',
  '宇宙、天体与科学探索',
  '校园、课程与学术研究',
  '技术设备、发明与数字生活',
  '文明、宗教与历史遗产',
  '文字、语言与沟通表达',
  '艺术、媒体与体育活动',
  '日常用品、材质与制造',
  '服装、外貌与消费潮流',
  '食材、菜品与烹饪方式',
  '建筑结构、居住与公共场所',
  '交通工具、路线与旅行体验',
  '政治组织、公共管理与国际关系',
  '商业、金融与社会发展',
  '法律制度、权利与责任',
  '战争、冲突与安全议题',
  '人物身份、关系与社会群体',
  '常见动作、变化与行为表达',
  '人体、情绪、疾病与治疗',
  '时间单位、年代与日期表达',
];

interface GeneratedChapter {
  id: number;
  title: string;
  words: VocabularyWord[];
}

const generatedChapters: GeneratedChapter[] = generatedVocabulary;

export const VOCABULARY_CHAPTERS: VocabularyChapter[] =
  generatedChapters.map(
    (chapter: GeneratedChapter): VocabularyChapter => ({
      id: chapter.id,
      title: chapter.title,
      subtitle: CHAPTER_SUBTITLES[chapter.id - 1] ?? '主题词汇',
      wordCount: chapter.words.length,
      words: chapter.words,
    }),
  );
