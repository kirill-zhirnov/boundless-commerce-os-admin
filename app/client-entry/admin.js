import {clientRegistry} from '../modules/registry/client/client.client';
import 'jquery-ui/ui/widgets/sortable';
import 'jquery-ui/ui/widgets/datepicker';
// import 'bootstrap/js/dist/tooltip';
// import 'bootstrap/js/dist/popover';

import '../views/less/backend.less';
import 'backgrid-paginator/backgrid-paginator.min.css';
import 'backbone-tree-view/css/bootstrap-theme.min.css';
import 'backbone-checkbox-list/css/bootstrap-theme.min.css';
import 'backbone-labels-list/css/bootstrap-theme.min.css';
import 'jquery-ui/themes/base/core.css';
import 'jquery-ui/themes/base/datepicker.css';
import 'jquery-ui/themes/base/theme.css';

import $ from 'jquery';

import wysiwygPlugin from '../modules/jquery/plugins/wysiwygTrumbowyg.client';
wysiwygPlugin($);

clientRegistry.getView().loadBundle('admin');

//we can't replace dayjs since Chart.js depends on moment.js
// import dayjs from 'dayjs'
// require(`dayjs/locale/${process.env.LOCALE}`);
// dayjs.locale(process.env.LOCALE);

// require('spectrum-colorpicker');
// require('spectrum-colorpicker/i18n/jquery.spectrum-ru');
