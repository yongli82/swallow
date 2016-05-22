#!/usr/bin/env python
# -*- coding:utf-8 -*-

# Support new str.format syntax in log messages
#
# Based on http://stackoverflow.com/a/25433007 and
# http://stackoverflow.com/a/26003573 and logging cookbook
# https://docs.python.org/3/howto/logging-cookbook.html#use-of-alternative-formatting-styles
#
# It's worth noting that this implementation has problems if key words
# used for brace substitution include level, msg, args, exc_info,
# extra or stack_info. These are argument names used by the log method
# of Logger. If you need to one of these names then modify process to
# exclude these names or just remove log_kwargs from the _log call. On
# a further note, this implementation also silently ignores misspelled
# keywords meant for the Logger (eg. ectra).
#


import logging
import logging.config
import os
from os.path import dirname, join, exists
from django.core.urlresolvers import reverse_lazy

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Log everything to the logs directory at the top
LOGFILE_ROOT = join(dirname(BASE_DIR), 'logs')

# Reset logging
# (see http://www.caktusgroup.com/blog/2015/01/27/Django-Logging-Configuration-logging_config-default-settings-logger/)

LOGGING_CONFIG = None
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': "[%(asctime)s] %(levelname)s [%(pathname)s:%(lineno)s] %(message)s",
            'datefmt': "%d/%b/%Y %H:%M:%S"
        },
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
        'standard': {
            'format': '%(asctime)s [%(threadName)s:%(thread)d] [%(name)s:%(lineno)d] [%(module)s:%(funcName)s] [%(levelname)s]- %(message)s'
        },
    },
    'handlers': {
        'app': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': join(LOGFILE_ROOT, 'app.log'),  # 日志输出文件
            'maxBytes': 1024 * 1024 * 5,  # 文件大小
            'backupCount': 5,  # 备份份数
            'formatter': 'verbose',  # 使用哪种formatters日志格式
        },
        'default': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': join(LOGFILE_ROOT, 'django.log'),
            'formatter': 'verbose'
        },
        'proj_log_file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': join(LOGFILE_ROOT, 'project.log'),
            'formatter': 'verbose'
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
        'error': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': join(LOGFILE_ROOT, 'error.log'),
            'maxBytes': 1024 * 1024 * 5,
            'backupCount': 5,
            'formatter': 'standard',
        },
        'request_handler': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': join(LOGFILE_ROOT, 'request.log'),
            'maxBytes': 1024 * 1024 * 5,
            'backupCount': 5,
            'formatter': 'standard',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'default', 'error'],
            'level': 'DEBUG',
            'propagate': False
        },
        'django.request': {
            'handlers': ['request_handler'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'project': {
            'handlers': ['proj_log_file'],
            'level': 'DEBUG',
        },
        'app': {
            'handlers': ['app', 'error', 'console'],
            'level': 'DEBUG',
            'propagate': True
        },
        'root': {
            'handlers': ['app', 'error', 'console'],
            'level': 'DEBUG',
            'propagate': True
        },
    }
}

logging.config.dictConfig(LOGGING)

log_file = os.path.join(LOGFILE_ROOT, "app.log")
logging.basicConfig(level=logging.INFO,
                    format='[%(asctime)s] %(levelname)s [%(pathname)s:%(lineno)s] %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S',
                    filename=log_file)



class NewStyleLogMessage(object):
    def __init__(self, message, *args, **kwargs):
        self.message = message
        self.args = args
        self.kwargs = kwargs

    def __str__(self):
        args = (i() if callable(i) else i for i in self.args)
        kwargs = dict((k, v() if callable(v) else v)
                      for k, v in self.kwargs.items())

        return self.message.format(*args, **kwargs)

N = NewStyleLogMessage


class StyleAdapter(logging.LoggerAdapter):
    def __init__(self, logger, extra=None):
        super(StyleAdapter, self).__init__(logger, extra or {})

    def log(self, level, msg, *args, **kwargs):
        if self.isEnabledFor(level):
            msg, log_kwargs = self.process(msg, kwargs)
            self.logger._log(level, N(msg, *args, **kwargs), (),
                             **log_kwargs)


logger = StyleAdapter(logging.getLogger("project"))
#   Emits "Lazily formatted log entry: 123 foo" in log
# logger.debug('Lazily formatted entry: {0} {keyword}', 123, keyword='foo')


