import React, { useState, useContext } from 'react';
import { Button, ButtonToolbar, Form, FormControl, Radio, Grid, Row, Col, Panel, Alert } from 'react-bootstrap';
import ElementActions from 'src/stores/alt/actions/ElementActions';
import UIActions from 'src/stores/alt/actions/UIActions';
import UIStore from 'src/stores/alt/stores/UIStore';
import StructureEditor from 'src/models/StructureEditor';
import SearchResult from './SearchResult';
import { observer } from 'mobx-react';
import { StoreContext } from 'src/stores/mobx/RootStore';

const KetcherRailsform = () => {
  const ketcherStructure = {
    structure: {
      path: 'ketcher',
      setMolfileInFrame: false,
      setMfFuncName: 'setMolecule',
      getMfFuncName: 'getMolfile',
      getMfWithCallback: false,
      getSVGFuncName: 'getSVG',
      getSVGWithCallback: false
    }
  }
  const editor = new StructureEditor({ ...ketcherStructure, id: 'ketcher' });

  const defaultValues = [{
    elementType: 'all',
    queryMolfile: null,
    searchType: 'sub',
    tanimotoThreshold: 0.7 
  }];
  const [changedValues, setChangedValues] = useState(defaultValues);
  const searchStore = useContext(StoreContext).search;
 
  const handleSearchTypeChange = (e) => {
    changedValues[0].searchType = e.target.value;
    setChangedValues((a) => [...a]);
  }

  const handleTanimotoChange = (e) => {
    const val = e.target && e.target.value;
    if (!isNaN(val - val)) {
      changedValues[0].tanimotoThreshold = e.target.value;
      setChangedValues((a) => [...a]);
    }
  }

  const handleSave = () => {
    const structure = editor.structureDef;
    const { molfile, info } = structure;
    handleStructureEditorSave(molfile);
  }

  const handleStructureEditorSave = (molfile) => {
    if (molfile) {
      changedValues[0].queryMolfile = molfile;
      setChangedValues((a) => [...a]);
    }
    searchStore.changeErrorMessage("Please fill out all needed fields");
    //// Check if blank molfile
    const molfileLines = molfile.match(/[^\r\n]+/g);
    //// If the first character ~ num of atoms is 0, we will not search
    if (molfileLines[1].trim()[0] != 0) {
      searchStore.showSearchResults();
      searchStore.changeErrorMessage("");
      structureSearch(molfile);
    }
  }

  const structureSearch = (molfile) => {
    const uiState = UIStore.getState();
    const { currentCollection } = uiState;
    const collectionId = currentCollection ? currentCollection.id : null;
    const isSync = currentCollection ? currentCollection.is_sync_to_me : false;
    let tanimoto = changedValues[0].tanimotoThreshold;
    if (tanimoto <= 0 || tanimoto > 1) { tanimoto = 0.3; }

    const selection = {
      elementType: changedValues[0].elementType,
      molfile,
      search_type: changedValues[0].searchType,
      tanimoto_threshold: tanimoto,
      page_size: uiState.number_of_results,
      search_by_method: 'structure',
      structure_search: true
    };
    searchStore.loadSearchResults({
      selection, collectionId, isSync
    });
    searchStore.clearSearchAndTabResults();
    searchValuesByMolfile();
  }

  const handleClear = () => {
    searchStore.clearSearchResults();
    setChangedValues(defaultValues);
    const iframe = document.querySelector('#ketcher').contentWindow;
    iframe.document.querySelector('#new').click();
  }

  const showErrorMessage = () => {
    if (searchStore.error_message) {
      return <Alert bsStyle="danger">{searchStore.error_message}</Alert>;
    }
  }

  const searchValuesByMolfile = () => {
    searchStore.changeSearchValues([changedValues[0].queryMolfile]);
  }

  const togglePanel = () => () => {
    if (searchStore.searchResultsCount > 0) {
      searchStore.toggleSearch();
      searchStore.toggleSearchResults();
    }
  }

  let defaultClassName = 'collapsible-search-result';
  let invisibleClassName = searchStore.search_result_panel_visible ? '' : ' inactive';
  let inactiveSearchClass = !searchStore.searchVisible ? 'inactive' : '';
  let inactiveResultClass = !searchStore.searchResultVisible? 'inactive' : '';
  let searchIcon = `fa fa-chevron-${searchStore.search_icon} icon-right`;
  let resultIcon = `fa fa-chevron-${searchStore.result_icon} icon-right`;
  let searchTitle = searchStore.searchVisible ? 'Search' : 'Refine search';
  let resultTitle = searchStore.searchResultVisible ? 'Result' : 'Back to result';

  return (
    <>
      <Panel
        id="collapsible-search"
        className={defaultClassName}
        onToggle={togglePanel()}
        expanded={searchStore.searchVisible}
      >
        <Panel.Heading className={inactiveSearchClass}>
          <Panel.Title toggle>
            {searchTitle}
            <i className={searchIcon} />
          </Panel.Title>
        </Panel.Heading>
        <Panel.Collapse>
          <Panel.Body>
            {showErrorMessage()}
            <iframe
              id="ketcher"
              src="/ketcher"
              title="Ketcher Rails"
              height="730px"
              width="100%"
              style={{border: 'none'}}
            />
            <Grid style={{ margin: 0, paddingLeft: 0 }}>
              <Row style={{ marginTop: '20px' }}>
                <Col sm={4} md={3}>
                  <ButtonToolbar>
                    <Button bsStyle="warning" onClick={() => searchStore.handleCancel()}>
                      Cancel
                    </Button>
                    <Button bsStyle="primary" onClick={handleSave} style={{ marginRight: '20px' }} >
                      Search
                    </Button>
                  </ButtonToolbar>
                </Col>
                <Col sm={6} md={4}>
                  <Form inline>
                    <Radio
                      value="similar"
                      checked={changedValues[0].searchType === 'similar'}
                      onChange={handleSearchTypeChange}
                    >
                      &nbsp; Similarity Search &nbsp;
                    </Radio>
                    &nbsp;&nbsp;
                    <FormControl
                      style={{ width: '40%' }}
                      type="text"
                      value={changedValues[0].tanimotoThreshold}
                      onChange={handleTanimotoChange}
                    />
                  </Form>
                </Col>
                <Col sm={4} md={2}>
                  <Radio
                    value="sub"
                    checked={changedValues[0].searchType === 'sub'}
                    onChange={handleSearchTypeChange}
                  >
                    Substructure Search
                  </Radio>
                </Col>
              </Row>
            </Grid>
          </Panel.Body>
        </Panel.Collapse>
      </Panel>
      <Panel
        id="collapsible-result"
        className={defaultClassName + invisibleClassName}
        onToggle={togglePanel()}
        expanded={searchStore.searchResultVisible}
      >
        <Panel.Heading className={inactiveResultClass}>
          <Panel.Title toggle>
            {resultTitle}
            <i className={resultIcon} />
          </Panel.Title>
        </Panel.Heading>
        <Panel.Collapse>
          <Panel.Body style={{minHeight: '120px'}}>
            <SearchResult
              handleClear={handleClear}
            />
          </Panel.Body>
        </Panel.Collapse>
      </Panel>
    </>
  );
}

export default observer(KetcherRailsform);