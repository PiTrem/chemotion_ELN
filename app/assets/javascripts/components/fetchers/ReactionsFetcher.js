import 'whatwg-fetch';
import Reaction from '../models/Reaction';
import Literature from '../models/Literature';
import ElementPermissionProxy from '../proxies/ElementPermissionProxy';

// TODO: Extract common base functionality into BaseFetcher
export default class ReactionsFetcher {
  static fetchById(id) {
    let promise = fetch('/api/v1/reactions/' + id + '.json', {
        credentials: 'same-origin'
      })
      .then((response) => {
        return response.json()
      }).then((json) => {
        return new ElementPermissionProxy(new Reaction(json.reaction));
      }).catch((errorMessage) => {
        console.log(errorMessage);
      });

    return promise;
  }

  static fetchByCollectionId(id, queryParams={}) {
    let page = queryParams.page || 1
    let per_page = queryParams.per_page || 7
    let api = id == 'all' ? `/api/v1/reactions.json?page=${page}&per_page=${per_page}` : `/api/v1/reactions.json?collection_id=${id}&page=${page}&per_page=${per_page}`
    let promise = fetch(api, {
        credentials: 'same-origin'
      })
      .then((response) => {
        return response.json().then((json) => {
          return {
            elements: json.reactions.map((r) => new ElementPermissionProxy(new Reaction(r))),
            totalElements: parseInt(response.headers.get('X-Total')),
            page: parseInt(response.headers.get('X-Page')),
            pages: parseInt(response.headers.get('X-Total-Pages')),
            perPage: parseInt(response.headers.get('X-Per-Page'))
          }
        })
      }).catch((errorMessage) => {
        console.log(errorMessage);
      });

    return promise;
  }

  static deleteReactionsByUIState(params) {
    const {ui_state, options} = params;

    let promise = fetch('/api/v1/reactions/ui_state/', {
      credentials: 'same-origin',
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ui_state: {
          all: ui_state.reaction.checkedAll,
          included_ids: ui_state.reaction.checkedIds,
          excluded_ids: ui_state.reaction.uncheckedIds
        },
        options: {
          delete_subsamples: options.delete_subsamples
        }
      })
    }).then((response) => {
      return response.json()
    }).then((json) => {
      return json;
    }).catch((errorMessage) => {
      console.log(errorMessage);
    });

    return promise;
  }

  static update(params) {
    let body = JSON.stringify({
      id: params.id,
      name: params.name,
      description: params.description,
      timestamp_start: params.timestamp_start,
      timestamp_stop: params.timestamp_stop,
      observation: params.observation,
      purification: params.purification,
      solvent: params.solvent,
      dangerous_products: params.dangerous_products,
      tlc_solvents: params.solvents,
      tlc_description: params.tlc_description,
      rf_value: params.rf_value,
      temperature: params.temperature,
      status: params.status,
      reaction_svg_file: params.reaction_svg_file,
      materials: {
        starting_materials: params.starting_materials.map(s=>s.serializeMaterial()),
        reactants: params.reactants.map(s=>s.serializeMaterial()),
        products: params.products.map(s=>s.serializeMaterial())
      },
      literatures: params.literatures.map(literature => literature.serialize())
    })
    let promise = fetch('/api/v1/reactions/' + params.id, {
      credentials: 'same-origin',
      method: 'put',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: body
    }).then((response) => {
      return response.json()
    }).then((json) => {
      return new Reaction(json.reaction);
    }).catch((errorMessage) => {
      console.log(errorMessage);
    });

    return promise;
  }

  static create(params) {
    let body = JSON.stringify({
      collection_id: params.collection_id,
      id: params.id,
      name: params.name,
      description: params.description,
      timestamp_start: params.timestamp_start,
      timestamp_stop: params.timestamp_stop,
      observation: params.observation,
      purification: params.purification,
      dangerous_products: params.dangerous_products,
      solvent: params.solvent,
      tlc_solvents: params.solvents,
      tlc_description: params.tlc_description,
      rf_value: params.rf_value,
      temperature: params.temperature,
      status: params.status,
      reaction_svg_file: params.reaction_svg_file,
      materials: {
        starting_materials: params.starting_materials.map(s=>s.serializeMaterial()),
        reactants: params.reactants.map(s=>s.serializeMaterial()),
        products: params.products.map(s=>s.serializeMaterial())
      },
      literatures: params.literatures.map(literature => literature.serialize())
    });
    let promise = fetch('/api/v1/reactions/', {
      credentials: 'same-origin',
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: body
    }).then((response) => {
      return response.json()
    }).then((json) => {
      return new Reaction(json.reaction);
    }).catch((errorMessage) => {
      console.log(errorMessage);
    });

    return promise;
  }
}
