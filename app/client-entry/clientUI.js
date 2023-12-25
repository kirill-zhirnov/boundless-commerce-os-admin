import 'font-awesome/css/font-awesome.css';

import 'devbridge-autocomplete';
import $ from 'jquery';
import 'jquery-mask-plugin';
import maskPhoneClient from '../modules/jquery/plugins/maskPhone.client';
maskPhoneClient($);

import animateCssClient from '../modules/jquery/plugins/animateCss.client';
animateCssClient($);
import 'animate.css';

import Dropzone from 'dropzone';
Dropzone.autoDiscover = false;

import 'dropzone/dist/basic.css';
import 'dropzone/dist/dropzone.css';
