import $ from "jquery";
import _ from "underscore";
import { View, Collection } from 'backbone';
import Backbone from 'backbone';

import {
  mg_dispatcher,
  SELECTION_CHANGED,
} from "../models/dispatcher";

let PART_WIDGET_TPL = require('../templates/widgetsbar/part.html');
let METADATA_WIDGET_TPL = require('../templates/widgetsbar/metadata.html');

class SingleNodeInfoWidget extends View {

    template(kwargs) {
        let compiled_tpl,
            file_tpl = require('../templates/widgetsbar/single_node_info.html');

        compiled_tpl = _.template(file_tpl(kwargs));

        return compiled_tpl();
    }

    initialize(node) {
        this.node = node;
    }

    render() {
        let context = {};

        context['title'] = this.node.get('title');
        context['ctype'] = this.node.get('ctype');

        return this.template(context);
    }
}

export class WidgetsBarView extends View {

    el() {
        return $("#widgetsbar");
    }

    initialize() {
        mg_dispatcher.on(SELECTION_CHANGED, this.selection_changed, this);
    }

    selection_changed(selection) {
        if (selection.length == 1) {
            this.render(selection[0]);
        } else {
            this.render(undefined);
        }
    }

    render(node) {
        let compiled = "",
            compiled_part,
            compiled_metadata,
            context,
            i,
            parts,
            metadata,
            info_widget;
        
        context = {};

        if (!node) {
            this.$el.html("");
            return;
        }

        info_widget = new SingleNodeInfoWidget(node);

        parts = node.get('parts');
        metadata = node.get('metadata');

        compiled_metadata = _.template(METADATA_WIDGET_TPL({
            'kvstore': new Collection(metadata),
        }));

        compiled += info_widget.render();
        compiled += compiled_metadata();


        if (parts) {
            for (i=0; i < parts.length; i++) {
                compiled_part = _.template(PART_WIDGET_TPL({
                    'part': parts[i],
                }));
                compiled += compiled_part();
            }
        }

        this.$el.html(compiled);
    }
}