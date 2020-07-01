import $ from "jquery";
import _ from "underscore";
import { Browse } from "../models/browse";
import { View } from 'backbone';
import Backbone from 'backbone';
import {
    mg_dispatcher,
    PARENT_CHANGED,
    SELECTION_CHANGED,
    BROWSER_REFRESH
} from "../models/dispatcher";
import { mg_browse_router } from "../routers/browse";


let TEMPLATE = require('../templates/browse.html');

export class BrowseView extends View {
  el() {
      return $('#browse');
  } 

  initialize(parent_id) {
    this.browse = new Browse(parent_id);
    this.browse.fetch();
    this.listenTo(this.browse, 'change', this.render);

    mg_dispatcher.on(BROWSER_REFRESH, this.refresh, this);
  }

  events() {
      let event_map = {
        'dblclick .node': 'open_node',
        'click .node': 'select_node'
      }
      return event_map;
  }

  select_node(event) {
    let data = $(event.currentTarget).data(),
      node,
      selected,
      new_state,
      $target,
      checkbox;

    $target = $(event.currentTarget);
    node = this.browse.nodes.get(data['cid']);

    if (node) {
      selected = node.get('selected');
      node.set({'selected': !selected});
      new_state = !selected;
      
      if (new_state) {
        $target.addClass('checked');
      } else {
        $target.removeClass('checked');
      }

      mg_dispatcher.trigger(
        SELECTION_CHANGED,
        this.get_selection()
      );
    }
  }

  get_selection() {
    return _.filter(
      this.browse.nodes.models, function(item) {
        return item.get('selected') == true;
      }
    );
  }

  open_node(event) {
    let data = $(event.currentTarget).data(),
      node;

    node = this.browse.nodes.get(data['cid']);

    // routers.browse handles PARENT_CHANGED event.
    if (node) {
      mg_dispatcher.trigger(PARENT_CHANGED, node.id);
    } else {
      mg_dispatcher.trigger(PARENT_CHANGED, undefined);
    }
  }

  open(node_id) {
    let parent_id = node_id;
    
    console.log(`Browse Open: new parent_id = ${parent_id}`);

    this.browse.set({'parent_id': node_id});
    this.browse.fetch();
  }

  refresh() {
    let parent_id = this.browse.get('parent_id');

    console.log(`refresh: current parent_id=${parent_id}`);
    this.open(parent_id);
  }

  render() {
    let compiled, context;
    
    context = {};

    compiled = _.template(TEMPLATE({
        'nodes': this.browse.nodes,
    }));

    this.$el.html(compiled);
  }
}