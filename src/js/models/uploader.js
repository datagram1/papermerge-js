import _ from "underscore";
import { Model, Collection } from 'backbone';
import $ from "jquery";
import {human_size} from "../utils";

export class UploaderItem extends Model {
    defaults() {
      return {
        title: '',
        size: '',
        file: '',
        lang: '',
        status: '',
        file_type: '',
        parent_id: -1,
        progress: 0
      };
    }

    initialize(file, lang, parent_id) {
      if (!parent_id) {
        parent_id = -1;
      }

      this.set({
          'title': file.name,
          'size': file.size,
          'file': file,
          'lang': lang,
          'file_type': file.type,
          'progress': 0,
          'parent_id': parent_id,
          'status': UploaderItem.INIT
      });
      // once uploader item instance is created
      // immediately start upload process.
      this.send();
    }

    static get INIT() {
      // this is initial state
      // before uploading starts
      return "init";
    }

    static get UPLOAD_START() {
      return "upload_start";
    }

    static get UPLOAD_ERROR() {
      return "upload_error";
    }

    static get UPLOAD_SUCCESS() {
      return "upload_success";
    }

    static get UPLOAD_PROGRESS() {
      return "upload_progress";
    }

    is_success() {
      return this.get('status') == UploaderItem.UPLOAD_SUCCESS;
    }

    is_error() {
      return this.get('status') == UploaderItem.UPLOAD_ERROR;
    }

    is_progress() {
      return this.get('status') == UploaderItem.UPLOAD_PROGRESS;
    }

    get human_size() {
       return human_size(this.get('size'));
    }

    set_progress(percent) {
        // percentage = (0..100), as integer
        this.set('progress', percent);
        this.trigger('change');
    }

    _build_form_data() {
        let form_data;

        form_data = new FormData();
        form_data.append("language", this.get('lang'));
        form_data.append("file_name", this.get("file_name"));
        form_data.append("file_type", this.get("file_type"));
        form_data.append("parent", this.get("parent_id"));
        form_data.append("file", this.get("file"));

        return form_data;
    }

    send() {
      /*
      This model class does NOT use Backbone's sync. The
      reason is that we need to closely monitor the progress of file uploads.
       */
      let xhr, percent, token, that = this;

      xhr = new XMLHttpRequest();
      xhr.addEventListener('progress', function(e){
         if (e.lengthComputable) {
             percent = Math.round((e.loaded * 100) / e.total);
             // notify subscribers of "upload_progress" event
            that.set_progress(percent);
         }
      });

      function transferFailed(e) {
        console.log(`Transfer failed for ${that.get('title')}`);
        that.set({
          'status': UploaderItem.UPLOAD_ERROR
        });
      }

      function transferComplete(e) {
        console.log(`Complete? status = ${e.currentTarget.status}`);

         if (e.currentTarget.status == 200) {
            that.set({
              'status': UploaderItem.UPLOAD_SUCCESS
            });
         } else if (e.currentTarget.status == 500) {
            that.set({
              'status': UploaderItem.UPLOAD_ERROR
            });
         } else if ( e.currentTarget.status == 400 ) {
            that.set({
              'status': UploaderItem.UPLOAD_ERROR
            });
         }
      }

      xhr.addEventListener("error", transferFailed);
      xhr.addEventListener("load", transferComplete);

      token = $("[name=csrfmiddlewaretoken]").val();

      xhr.open("POST", "/upload/");
      xhr.setRequestHeader(
          "X-CSRFToken",
          token
      )

      xhr.send(this._build_form_data());
    } // send
}

export class Uploader extends Collection {
    get model() {
        return UploaderItem;
    }

    initialize() {

    }
}
