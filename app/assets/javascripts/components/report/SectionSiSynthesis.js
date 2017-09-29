import React from 'react';
import _ from 'lodash';
import { SVGContent } from './SectionReaction';
import QuillViewer from '../QuillViewer';
import { digit } from '../utils/MathUtils';
import { rmOpsRedundantSpaceBreak, frontBreak } from '../utils/quillFormat';
import ArrayUtils from '../utils/ArrayUtils';
import { Alphabet } from '../utils/ElementUtils';

const onlyBlank = (target) => {
  if (target.length === 0) return true;
  const content = target.map(t => t.insert).join('').replace(/\s+/, '');
  return !content;
};

const sampleMoleculeName = (s) => {
  const mnh = s.molecule_name_hash;
  const mnLabel = mnh && mnh.desc !== 'sum_formular' ? mnh.label : null;
  const iupac = s.molecule.iupac_name;
  if (mnLabel) {
    return mnLabel;
  } else if (iupac) {
    return iupac;
  }
  return null;
};

const Title = ({ el, counter }) => {
  let iupacs = el.products.map((p, i) => {
    const key1 = `${i}-text`;
    const key2 = `${i}-slash`;
    const smn = sampleMoleculeName(p);
    if (smn) {
      return [<span key={key1}>{smn}</span>,
        <span key={key2}> / </span>];
    }
    return [<span key={key1}>"<b>NAME</b>"</span>,
      <span key={key2}> / </span>];
  });
  iupacs = _.flatten(iupacs).slice(0, -1);

  return (
    <p>
      <span>[4.{counter}] </span>
      {iupacs}
      <span> (<b>xx</b>)</span>
    </p>
  );
};

const deltaSampleMoleculeName = (s) => {
  const smn = sampleMoleculeName(s);
  if (smn) {
    return { insert: smn };
  }
  return { attributes: { bold: 'true' }, insert: '"NAME"' };
};

const boldXX = () => {
  return { attributes: { bold: "true" }, insert: "xx" };
}

const ProductsInfo = ({ products = [] }) => {
  let content = [];
  products.forEach((p) => {
    let ea = [];
    const m = p.molecule;
    p.elemental_compositions.forEach((ec) => {
      if (ec.description === 'By molecule formula') {
        for (let [k, v] of Object.entries(ec.data)) {
          ea = [...ea, `${k}, ${v}`];
        }
      }
      return null;
    });
    ea = ea.filter(r => r != null).join('; ');
    const cas = p.xref && p.xref.cas ? p.xref.cas.value : '- ';
    const pFormula = `Formula: ${m.sum_formular}; `;
    const pCAS = `CAS: ${cas}; `;
    const pSmiles = `Smiles: ${m.cano_smiles}; `;
    const pInCHI = `InCHI: ${m.inchikey}; `;
    const pMMass = `Molecular Mass: ${digit(m.molecular_weight, 4)}; `;
    const pEMass = `Exact Mass: ${digit(m.exact_molecular_weight, 4)}; `;
    const pEA = `EA: ${ea}.`;
    content = [...content,
      { insert: 'Name: ' },
      deltaSampleMoleculeName(p),
      { insert: '; ' },
      { insert: pFormula + pCAS + pSmiles + pInCHI + pMMass + pEMass + pEA },
      { insert: '\n' },
    ];
  });
  content = content.slice(0, -1);
  return <QuillViewer value={{ ops: content }} />;
};

const stAndReContent = (el, prevCounter, prevContent) => {
  let counter = prevCounter;
  let content = prevContent;
  [...el.starting_materials, ...el.reactants].forEach((elm) => {
    counter += 1;
    content = [...content,
      { insert: `{${Alphabet(counter)}|` },
      boldXX(),
      { insert: '} ' },
      deltaSampleMoleculeName(elm),
      { insert: ` (${elm.amount_g} g, ${digit(elm.amount_mol * 1000, 4)} mmol, ${digit(elm.equivalent, 2)} equiv.); ` }];
  });
  return { counter, content };
};

const solventsContent = (el, prevCounter, prevContent) => {
  let counter = prevCounter;
  let content = prevContent;
  el.solvents.forEach((elm) => {
    counter += 1;
    content = [...content,
      { insert: `{${Alphabet(counter)}` },
      { insert: '} ' },
      deltaSampleMoleculeName(elm),
      { insert: ` (${digit(elm.amount_l * 1000, 2)} mL); ` }];
  });
  return { counter, content };
};

const porductsContent = (el, prevCounter, prevContent) => {
  let counter = prevCounter;
  let content = prevContent;
  content = [...content, { insert: 'Yield: ' }];
  el.products.forEach((p) => {
    counter += 1;
    content = [...content,
      { insert: `{${Alphabet(counter)}|` },
      boldXX(),
      { insert: '} ' },
      { insert: ` = ${digit(p.equivalent * 100, 0)}%` },
      { insert: ` (${p.amount_g} g, ${digit(p.amount_mol * 1000, 4)} mmol)` },
      { insert: '; ' }];
  });
  content = content.slice(0, -1);
  content = [...content, { insert: '.' }];
  return { counter, content };
};

const materailsContent = (el) => {
  const counter = 0;
  const content = [];
  const stAndRe = stAndReContent(el, counter, content);
  const solvCon = solventsContent(el, stAndRe.counter, stAndRe.content);
  const prodCon = porductsContent(el, solvCon.counter, solvCon.content);

  return prodCon.content;
};

const tlcContent = (el) => {
  let content = [];
  if (el.tlc_solvents) {
    content = [{ attributes: { italic: 'true' }, insert: 'R' },
      { attributes: { script: 'sub', italic: 'true' }, insert: 'f' },
      { insert: ` = ${el.rf_value} (${el.tlc_solvents}).` }];
  }
  return content;
};

const obsvTlcContent = (el) => {
  let content = [];
  content = [...el.observation.ops, ...tlcContent(el)];
  content = rmOpsRedundantSpaceBreak(content);
  if (onlyBlank(content)) return [];
  return frontBreak(content);
};

const rmHeadSpace = (content) => {
  let els = content;
  let head = null;
  els.some((el) => {
    head = el.insert.replace(/^\s+/, '');
    if (!head) els = [...els.slice(1)];
    return head;
  });
  if (onlyBlank(els) || !head) return [];
  els[0].insert = head;

  return els;
};

const rmTailSpace = (content) => {
  let els = content;
  let tail = null;
  els.reverse().some((el) => {
    tail = el.insert.replace(/\s*[,.;]*\s*$/, '');
    if (!tail) els = [...els.slice(1)];
    return tail;
  });
  if (onlyBlank(els) || !tail) return [];
  els.reverse();
  els[els.length - 1].insert = tail;

  return els;
};

const opsTailWithSymbol = (els, symbol) => [...els, { insert: symbol }];

const endingSymbol = (content, symbol) => {
  if (onlyBlank(content)) return [];

  let els = rmHeadSpace(content);
  els = rmTailSpace(els);

  if (onlyBlank(els)) return [];

  return opsTailWithSymbol(els, symbol);
};

const analysesContent = (products) => {
  let content = [];
  products.forEach((p) => {
    const sortAnalyses = ArrayUtils.sortArrByIndex(p.analyses);
    sortAnalyses.forEach((a) => {
      const data = a && a.extended_metadata
        && a.extended_metadata.report
        && a.extended_metadata.report === 'true'
        ? JSON.parse(a.extended_metadata.content)
        : { ops: [] };
      content = [...content, ...endingSymbol(data.ops, '; ')];
    });
  });
  if (onlyBlank(content)) return [];
  content = rmOpsRedundantSpaceBreak(content);
  content = [...content.slice(0, -1), { insert: '.' }];
  return frontBreak(content);
};

const dangContent = (el) => {
  if (el.dangerous_products.length === 0) return [];
  let content = [{ attributes: { bold: 'true' }, insert: 'Attention! ' },
    { insert: 'The reaction includes the use of dangerous ' +
      'chemicals, which have the following ' +
      'classification: ' }];
  el.dangerous_products.forEach((d) => {
    content = [...content, { insert: d }, { insert: ', ' }];
  });
  content = content.slice(0, -1);
  content = rmOpsRedundantSpaceBreak(content);
  return content;
};

const DangerBlock = ({ el }) => {
  const block = dangContent(el);
  return block.length > 0 ? <QuillViewer value={{ ops: block }} /> : null;
};

const descContent = (el) => {
  if (el.role !== 'single') return [];
  let block = rmOpsRedundantSpaceBreak(el.description.ops);
  block = [{ insert: '\n' }, ...block, { insert: '\n' }];
  return block;
};

const synNameContent = el => [{ insert: `${el.name}: ` }];

const ContentBlock = ({ el }) => {
  const synName = synNameContent(el);
  const desc = descContent(el);
  const materials = materailsContent(el);
  const obsvTlc = obsvTlcContent(el);
  const analyses = analysesContent(el.products);
  const block = [...synName, ...desc, ...materials, ...obsvTlc, ...analyses];
  return <QuillViewer value={{ ops: block }} />;
};

const SynthesisRow = ({ el, counter, configs }) => (
  <div>
    <Title el={el} counter={counter} />
    <SVGContent
      show
      svgPath={el.svgPath}
      products={el.products}
      isProductOnly={!configs.Showallchemi}
    />
    <ProductsInfo products={el.products} />
    <ContentBlock el={el} />
    <DangerBlock el={el} />
  </div>
);

const SectionSiSynthesis = ({ selectedObjs, configs }) => {
  let counter = 0;
  const contents = selectedObjs.map((obj) => {
    if (obj.type === 'reaction' && obj.role !== 'gp') {
      counter += 1;
      return (
        <SynthesisRow
          id={obj.id}
          key={obj.id}
          el={obj}
          counter={counter}
          configs={configs}
        />
      );
    }
    return null;
  }).filter(r => r !== null);

  return (
    <div>
      {contents}
    </div>
  );
};

export default SectionSiSynthesis;
