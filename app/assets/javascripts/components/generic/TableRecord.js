/* eslint-disable no-empty */
/* eslint-disable react/forbid-prop-types */
import PropTypes from 'prop-types';
import React from 'react';
import Numeral from 'numeral';
import GenericSubField from '../models/GenericSubField';
import { AddRowBtn, DelRowBtn } from './GridBtn';
import { ColumnHeader, ColumnRow, NoRow } from './GridEntry';
import UConverterRenderer from './UConverterRenderer';
import { genUnits, unitConversion, molOptions } from '../../admin/generic/Utils';
import DropRenderer from './DropRenderer';
import DropMolRenderer from './DropMolRenderer';

export default class TableRecord extends React.Component {
  constructor(props) {
    super(props);
    this.delRow = this.delRow.bind(this);
    this.addRow = this.addRow.bind(this);
    this.onCellChange = this.onCellChange.bind(this);
    this.onUnitClick = this.onUnitClick.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.getColumns = this.getColumns.bind(this);
  }

  onCellChange(params) {
    const { e, columnDef, rowValue } = params;
    const newValue = e.target.value;
    const oldValue = rowValue[columnDef.field].value;
    if (oldValue === newValue) return;
    if (columnDef.type === 'text') {
      rowValue[columnDef.field] = newValue;
    }
    if (columnDef.type === 'system-defined') {
      if (isNaN(newValue)) return;
      rowValue[columnDef.field].value = Numeral(newValue).value();
    }
    const { opt } = this.props;
    const subVals = opt.f_obj.sub_values || [];
    const idx = subVals.findIndex(s => s.id === rowValue.id);
    subVals.splice(idx, 1, rowValue);
    opt.f_obj.sub_values = subVals;
    opt.onSubChange(0, 0, opt.f_obj, true);
  }

  onUnitClick(subField, node) {
    const { data } = node;
    const { opt } = this.props;
    const subVals = opt.f_obj.sub_values || [];
    const subVal = subVals.find(s => s.id === data.id);
    const units = genUnits(subField.option_layers);
    let uIdx = units.findIndex(u => u.key === subVal[subField.id].value_system);
    if (uIdx < units.length - 1) uIdx += 1; else uIdx = 0;
    const vs = units.length > 0 ? units[uIdx].key : '';
    const v = unitConversion(subField.option_layers, vs, subVal[subField.id].value);
    subVal[subField.id] = { value: v, value_system: vs };
    const idx = subVals.findIndex(s => s.id === data.id);
    subVals.splice(idx, 1, subVal);
    opt.f_obj.sub_values = subVals;
    opt.onSubChange(subField, subField.id, opt.f_obj, true);
  }

  onDrop(targetProps, targetOpt) {
    const { opt } = this.props;
    const subField = targetOpt.sField;
    const subVals = opt.f_obj.sub_values || [];
    const subVal = subVals.find(s => s.id === targetOpt.data.id);
    subVal[subField.id] = { value: targetProps };
    const idx = subVals.findIndex(s => s.id === targetOpt.data.id);
    subVals.splice(idx, 1, subVal);
    opt.f_obj.sub_values = subVals;
    opt.onSubChange(subField, subField.id, opt.f_obj, true);
  }

  getColumns() {
    const { opt } = this.props;
    let columnDefs = [];
    (opt.f_obj.sub_fields || []).forEach((sF) => {
      let colDef = {
        type: sF.type, headerName: sF.col_name, field: sF.id
      };
      const colDefExt = [];
      if (sF.type === 'text') {
        colDef = Object.assign({}, colDef, {
          editable: true, onCellChange: this.onCellChange
        });
      }
      if (sF.type === 'system-defined') {
        const cellParams = { sField: sF, onChange: this.onUnitClick };
        colDef = Object.assign({}, colDef, {
          cellRenderer: UConverterRenderer, cellParams, onCellChange: this.onCellChange
        });
      }
      if (sF.type === 'drag_molecule') {
        const cellParams = { sField: sF, opt, onChange: this.onDrop };
        colDef = Object.assign({}, colDef, {
          cellRenderer: DropRenderer, cellParams, onCellChange: this.onCellChange, width: '5vw'
        });
        const conf = ((sF.value || '').split(';') || []);
        conf.forEach((c) => {
          const molOpt = molOptions.find(m => m.value === c);
          if (molOpt) {
            const ext = {
              colId: c, editable: false, type: 'text', headerName: molOpt.label, cellRenderer: DropMolRenderer, cellParams: { molOpt, sField: sF }
            };
            colDefExt.push(ext);
          }
        });
      }
      columnDefs.push(colDef);
      if (colDefExt.length > 0) columnDefs = columnDefs.concat(colDefExt);
    });
    const act = {
      type: 'button',
      headerName: '',
      colId: opt.f_obj.field,
      headerComponent: AddRowBtn,
      headerParams: { addRow: this.addRow },
      cellRenderer: DelRowBtn,
      cellParams: { delRow: this.delRow },
      width: 'unset',
    };
    columnDefs.splice(0, 0, act);
    return columnDefs;
  }

  delRow(rowData) {
    const { opt } = this.props;
    opt.f_obj.sub_values = opt.f_obj.sub_values.filter(s => s.id !== rowData.id);
    opt.onSubChange(0, 0, opt.f_obj, true);
  }

  addRow() {
    const { opt } = this.props;
    const subFields = opt.f_obj.sub_fields || [];
    const newSub = new GenericSubField();
    subFields.map((e) => {
      if (e.type === 'text') return Object.assign(newSub, { [e.id]: '' });
      return Object.assign(newSub, { [e.id]: { value: '', value_system: e.value_system } });
    });
    opt.f_obj.sub_values = opt.f_obj.sub_values || [];
    opt.f_obj.sub_values.push(newSub);
    opt.onSubChange(0, 0, opt.f_obj, true);
  }

  render() {
    const { opt } = this.props;
    const columnDefs = this.getColumns();
    if (opt.isSearchCriteria) return (<div>(This is a table)</div>);
    if ((opt.f_obj.sub_fields || []).length < 1) return null;
    return (
      <div>
        {ColumnHeader(columnDefs)}
        <div>{NoRow(opt.f_obj.sub_values)}</div>
        <div>{(opt.f_obj.sub_values || []).map(s => ColumnRow(columnDefs, s))}</div>
      </div>
    );
  }
}

TableRecord.propTypes = {
  opt: PropTypes.object.isRequired,
};
