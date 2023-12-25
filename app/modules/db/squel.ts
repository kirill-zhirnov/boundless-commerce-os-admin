import squelBasic from 'squel';

const squel = squelBasic.useFlavour('postgres');
squel.cls.DefaultQueryBuilderOptions.numberedParameters = false;
squel.cls.DefaultQueryBuilderOptions.autoQuoteAliasNames = false;

export default squel;