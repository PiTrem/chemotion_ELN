import React, { useState, useEffect, useContext } from 'react';
import { Button, ButtonToolbar, Panel, Alert } from 'react-bootstrap';
import ElementActions from 'src/stores/alt/actions/ElementActions';
import UIStore from 'src/stores/alt/stores/UIStore';
import UIActions from 'src/stores/alt/actions/UIActions';
import AdvancedSearchRow from './AdvancedSearchRow';
import SearchResult from './SearchResult';
import { observer } from 'mobx-react';
import { StoreContext } from 'src/stores/mobx/RootStore';

const AdvancedSearchForm = () => {
  const defaultSelections = [{
    link: '',
    match: '=',
    field: {
      table: 'samples',
      column: 'name',
      label: 'Sample Name',
    },
    value: ''
  }];

  const [selectedOptions, setSelectedOptions] = useState(defaultSelections);
  const searchStore = useContext(StoreContext).search;

  useEffect(() => {
    const length = selectedOptions.length - 1;
    const lastInputRow = selectedOptions[length];

    const checkSelectedElements =
      (lastInputRow.field && lastInputRow.value && lastInputRow.link) ||
      (length == 0 && lastInputRow.field && lastInputRow.value);

    if (checkSelectedElements) {
      selectedOptions.push({ link: 'OR', match: 'LIKE', field: '', value: '' });
      setSelectedOptions((a) => [...a]);
    }
  }, [selectedOptions, setSelectedOptions]);

  const filterSelectedOptions = () => {
    const filteredOptions = selectedOptions.filter((f, id) => {
      return (f.field && f.link && f.value) ||
        (id == 0 && f.field && f.value)
    });
    searchStore.changeSearchFilter(filteredOptions);
    const storedFilter = searchStore.searchFilters;
    return storedFilter.length == 0 ? [] : storedFilter[0].filters;
  }

  const handleSave = () => {
    const uiState = UIStore.getState();
    const { currentCollection } = uiState;
    const collectionId = currentCollection ? currentCollection.id : null;
    const filters = filterSelectedOptions();
    searchStore.changeErrorMessage("Please fill out all needed fields");

    if (filters.length > 0) {
      searchStore.showSearchResults();
      searchStore.changeErrorMessage("");

      const selection = {
        elementType: 'all',
        advanced_params: filters,
        search_by_method: 'advanced',
        page_size: uiState.number_of_results
      };

      searchStore.loadSearchResults({
        selection,
         collectionId: collectionId,
         isSync: uiState.isSync,
      });
      searchStore.clearSearchAndTabResults();
      searchValuesByFilters();
    }
  }

  const handleClear = () => {
    searchStore.clearSearchResults();
    setSelectedOptions(defaultSelections);
  }

  const showErrorMessage = () => {
    if (searchStore.error_message) {
      return <Alert bsStyle="danger">{searchStore.error_message}</Alert>;
    }
  }

  const searchValuesByFilters = () => {
    const storedFilter = searchStore.searchFilters;
    const filters = storedFilter.length == 0 ? [] : storedFilter[0].filters;
    let searchValues = [];

    if (searchStore.searchResultVisible && filters.length > 0) {
      filters.map((val, i) => {
        searchValues.push([val.link, val.field.label, val.match, val.value].join(" "));
      });
    }
    searchStore.changeSearchValues(searchValues);
  }

  const renderDynamicRow = () => {
    let dynamicRow = ( <span /> );

    if (selectedOptions.length > 1) {
      let addedSelections = selectedOptions.filter((val, idx) => idx > 0);

      dynamicRow = addedSelections.map((selection, idx) => {
        let id = idx + 1;
        return (
          <AdvancedSearchRow
            idx={id}
            selection={selection}
            key={`selection_${id}`}
            onChange={handleChangeSelection}
          />
        );
      });
    }

    return dynamicRow;
  };

  const formElementValue = (formElement, e) => {
    switch(formElement) {
      case 'value':
        return e.target.value;
        break;
      case 'field':
        return e.value;
        break;
      default:
        return e;
    }
  }

  const handleChangeSelection = (idx, formElement) => (e) => {
    let value = formElementValue(formElement, e);
    selectedOptions[idx][formElement] = value;
    setSelectedOptions((a) => [...a]);
  }

  const togglePanel = () => () => {
    if (searchStore.searchResultsCount > 0) {
      searchStore.toggleSearch();
      searchStore.toggleSearchResults();
      searchStore.clearTabCurrentPage();
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
            <div className="advanced-search">
              {showErrorMessage()}
              <div>
                <AdvancedSearchRow
                  idx={0}
                  selection={selectedOptions[0]}
                  key={"selection_0"}
                  onChange={handleChangeSelection}
                />
                {renderDynamicRow()}
              </div>
            </div>
            <ButtonToolbar>
              <Button bsStyle="warning" onClick={() => searchStore.handleCancel()}>
                Cancel
              </Button>
              <Button bsStyle="primary" onClick={handleSave} style={{ marginRight: '20px' }} >
                Search
              </Button>
            </ButtonToolbar>
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

export default observer(AdvancedSearchForm);