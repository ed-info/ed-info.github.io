/**
 * Source: https://github.com/google/blockly/tree/master/demos/custom-dialogs
 * Modifications: Pt 2021 - MIT-License
 * 
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @namespace
 */
CustomDialog = {};

/** Override Blockly.alert() with custom implementation. */
Blockly.dialog.alert = function(message, callback) {
  CustomDialog.show('Повідомлення...', message, {
    onCancel: callback
  });
};

/** Override Blockly.confirm() with custom implementation. */
Blockly.dialog.confirm = function(message, callback) {
  CustomDialog.show('Підтвердження...', message, {
    showOkay: true,
    onOkay: function() {
      callback(true);
    },
    showCancel: true,
    onCancel: function() {
      callback(false);
    }
  });
};

/** Override Blockly.prompt() with custom implementation. */
Blockly.dialog.prompt = function(message, defaultValue, callback) {
  CustomDialog.show('Введення...', message, {
    showInput: true,
    showOkay: true,
    onOkay: function() {
      callback(CustomDialog.inputField.value);
    },
    showCancel: true,
    onCancel: function() {
      callback(null);
    }
  });
  CustomDialog.inputField.value = defaultValue;
};

/** Hides any currently visible dialog. */
CustomDialog.hide = function() {
  if (CustomDialog.backdropDiv_) {
    CustomDialog.backdropDiv_.style.display = 'none';
    CustomDialog.dialogDiv_.style.display = 'none';
  }
};

/**
 * Shows the dialog.
 * Allowed options:
 *  - showOkay: Whether to show the OK button.
 *  - showCancel: Whether to show the Cancel button.
 *  - showInput: Whether to show the text input field.
 *  - onOkay: Callback to handle the okay button.
 *  - onCancel: Callback to handle the cancel button and backdrop clicks.
 */
CustomDialog.show = function(title, message, options) {
  var backdropDiv = CustomDialog.backdropDiv_;
  var dialogDiv = CustomDialog.dialogDiv_;
  if (!dialogDiv) {
    // Generate HTML
    backdropDiv = document.createElement('div');
    backdropDiv.id = 'customDialogBackdrop';
    backdropDiv.style.cssText =
        'position: absolute;' +
        'top: 0; left: 0; right: 0; bottom: 0;' +
        'background-color: rgba(255, 255, 255, .7);' +
        'z-index: 100;';
    document.body.appendChild(backdropDiv);

    dialogDiv = document.createElement('div');
    dialogDiv.id = 'customDialog';
    dialogDiv.className = "card";
    dialogDiv.style.cssText =
        'background-color: #fff;' +
        'width: 400px;' +
        'margin: 20px auto 0;' +
        'padding: 20px;';
    backdropDiv.appendChild(dialogDiv);

    dialogDiv.onclick = function(event) {
      event.stopPropagation();
    };

    CustomDialog.backdropDiv_ = backdropDiv;
    CustomDialog.dialogDiv_ = dialogDiv;
  }
  backdropDiv.style.display = 'block';
  dialogDiv.style.display = 'block';

  dialogDiv.innerHTML =
      '<h5 class="card-title"></h5>' +
      '<p class="card-body" style="padding: 0px; margin-top: 10px; margin-bottom: 10px"></p>' +
      (options.showInput ? '<div><input style="margin-bottom: 10px" type="text" class="form-control" id="customDialogInput"></div>' : '') +
      '<div class="customDialogButtons">' +
      (options.showCancel ? '<button type="button" class="btn btn-outline-primary" style="margin-right: 10px" id="customDialogCancel">Скасувати</button>': '') +
      (options.showOkay ? '<button type="button" class="btn btn-outline-primary" id="customDialogOkay">Підтвердити</button>': '') +
      '</div>';
  dialogDiv.getElementsByClassName('card-title')[0]
      .appendChild(document.createTextNode(title));
  dialogDiv.getElementsByClassName('card-body')[0]
      .appendChild(document.createTextNode(message));

  var onOkay = function(event) {
    CustomDialog.hide();
    options.onOkay && options.onOkay();
    event && event.stopPropagation();
  };
  var onCancel = function(event) {
    CustomDialog.hide();
    options.onCancel && options.onCancel();
    event && event.stopPropagation();
  };

  var dialogInput = document.getElementById('customDialogInput');
  CustomDialog.inputField = dialogInput;
  if (dialogInput) {
    dialogInput.focus();

    dialogInput.onkeyup = function(event) {
      if (event.keyCode == 13) {
        // Process as OK when user hits enter.
        onOkay();
        return false;
      } else if (event.keyCode == 27)  {
        // Process as cancel when user hits esc.
        onCancel();
        return false;
      }
    };
  } else {
    var okay = document.getElementById('customDialogOkay');
    okay && okay.focus();
  }

  if (options.showOkay) {
    document.getElementById('customDialogOkay')
        .addEventListener('click', onOkay);
  }
  if (options.showCancel) {
    document.getElementById('customDialogCancel')
        .addEventListener('click', onCancel);
  }

  backdropDiv.onclick = onCancel;
};
