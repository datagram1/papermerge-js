import _ from "underscore";
import { Model, Collection } from 'backbone';
import { Node, NodeCollection } from "./node";

import {
    mg_dispatcher,
    PARENT_CHANGED,
} from "./dispatcher";

export class Browse extends Model {
    defaults() {
      return {
        nodes: [],
        parent_id: '',
      };
    }

    initialize(parent_id) {
        this.parent_id = parent_id;
        this.nodes = new NodeCollection();
    }

    urlRoot() {
        let parent_id = this.get('parent_id');

        if (parent_id) {
            return `/browse/${parent_id}/`;
        }

        return '/browse/'
    }

    toJSON() {

        let dict = {
            id: this.get('id'),
            parent_id: this.get('parent_id'),
            nodes: this.get('nodes'),
        }

        return dict;
    }

    open(parent_node, notify_all) {
        let browse = new Browse(parent_node.id),
            that = this;

        browse.fetch();
        browse.on('change', function(event){
            that.nodes = browse.nodes;
            that.parent_id = browse.parent_id;
            that.trigger('change');
            if (notify_all) {
                // inform everybody about new parent
                mg_dispatcher.trigger(
                    PARENT_CHANGED,
                    browse.parent_id
                )
            }
        });
    }

    parse(response, options) {

        let nodes = response.nodes,
            that=this,
            parent_id = response.parent_id;

        that.nodes.reset();

        _.each(nodes, function(item){
            that.nodes.add(new Node(item))
        });

        this.set({'parent_id': parent_id});

       this.trigger('change');
    }
}
