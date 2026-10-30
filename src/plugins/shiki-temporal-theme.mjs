// temporal.io's code palette as a Shiki theme, the same --code-* tokens the
// demo buildkit's code view and slide decks use, so code reads alike on a
// demo panel, a slide, and here. Comments are lifted from the site's #576e8f
// to #7c8fb1 so they stay above 4.5:1 on the dark code background.
const text = '#f8fafc';
const keyword = '#7f86f1';
const fn = '#cccef0';
const string = '#edc38d';
const literal = '#59fda0'; // numbers, constants, types
const comment = '#7c8fb1';

export default {
  name: 'temporal-dark',
  type: 'dark',
  colors: {
    'editor.background': '#171626',
    'editor.foreground': text,
  },
  settings: [
    { settings: { foreground: text, background: '#171626' } },
    {
      scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
      settings: { foreground: comment },
    },
    {
      scope: [
        'keyword',
        'storage',
        'storage.type',
        'storage.modifier',
        'keyword.control',
        'keyword.operator.new',
        'keyword.operator.expression',
        'keyword.operator.logical.python',
        'variable.language.this',
        'entity.name.tag',
      ],
      settings: { foreground: keyword },
    },
    // Operators and punctuation stay plain text, as in the code view.
    {
      scope: ['keyword.operator', 'punctuation'],
      settings: { foreground: text },
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'meta.function-call.generic',
        'variable.function',
        'entity.other.attribute-name',
        'meta.decorator',
        'entity.name.function.decorator',
      ],
      settings: { foreground: fn },
    },
    {
      scope: ['string', 'punctuation.definition.string', 'string.template', 'markup.inline.raw'],
      settings: { foreground: string },
    },
    {
      scope: [
        'constant',
        'constant.numeric',
        'constant.language',
        'support.constant',
        'entity.name.type',
        'support.type',
        'support.class',
        'entity.name.class',
        'storage.type.primitive',
        'storage.type.built-in',
        'variable.language.self',
        'variable.parameter.function.language.special.self',
        'support.type.property-name',
        'entity.name.tag.yaml',
      ],
      settings: { foreground: literal },
    },
  ],
};
