#!/usr/bin/env python
# -*- coding:utf-8 -*-


from __future__ import unicode_literals

from django.views.generic import ListView, DetailView
from django.views.generic.edit import CreateView, UpdateView, DeleteView
from django.core.urlresolvers import reverse_lazy
from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Submit, HTML
from django.utils.translation import ugettext_lazy as _

PAGE_NUM = 10

from django.conf.urls import url


class PageViewSet(object):
    url_prefix = ""
    model = None
    form_class = None
    fields = []
    form_fields = None
    list_fields = None
    list_template_name = "PageViewSet/list.html"
    create_template_name = "PageViewSet/create.html"
    update_template_name = "PageViewSet/update.html"
    detail_template_name = "PageViewSet/detail.html"
    delete_template_name = "PageViewSet/delete.html"

    def verbose_name(self):
        return self.model._meta.verbose_name

    @property
    def list_url(self):
        return "{0}-list-page".format(self.url_prefix)

    @property
    def create_url(self):
        return "{0}-create-page".format(self.url_prefix)

    @property
    def detail_url(self):
        return "{0}-detail-page".format(self.url_prefix)

    @property
    def update_url(self):
        return "{0}-update-page".format(self.url_prefix)

    @property
    def delete_url(self):
        return "{0}-delete-page".format(self.url_prefix)

    def urlpatterns(self):
        url_patterns = [
            url(r'^{0}/list/$'.format(self.url_prefix), self.list_view().as_view(),
                name=self.list_url),
            url(r'^{0}/create/$'.format(self.url_prefix), self.create_view().as_view(),
                name=self.create_url),
            url(r'^{0}/detail/(?P<pk>\w+)$'.format(self.url_prefix), self.detail_view().as_view(),
                name=self.detail_url),
            url(r'^{0}/update/(?P<pk>\w+)$'.format(self.url_prefix), self.update_view().as_view(),
                name=self.update_url),
            url(r'^{0}/delete/(?P<pk>\w+)$'.format(self.url_prefix), self.delete_view().as_view(),
                name=self.delete_url),
        ]

        return url_patterns

    def list_view(self):
        class PageListView(ListView):
            model = self.model
            fields = self.list_fields or self.fields
            title = u"%s列表" % self.verbose_name()
            template_name = self.list_template_name
            context_object_name = 'object_list'
            paginate_by = PAGE_NUM
            http_method_names = ['get']
            url_prefix = self.url_prefix

            def get_queryset(self):
                object_list = self.model.objects.order_by("-updated_at")
                return object_list

            def get_context_data(self, **kwargs):
                columns = []
                model_fields = self.model._meta.fields
                for model_field in model_fields:
                    if self.fields is None or len(self.fields) == 0:
                        # All fields
                        columns.append((model_field.verbose_name, model_field.name))
                    else:
                        for _field in self.fields:
                            if _field.split(".")[0] == model_field.name:
                                columns.append((model_field.verbose_name, _field))

                kwargs["columns"] = columns
                return super(PageListView, self).get_context_data(**kwargs)

        return PageListView

    def get_form_class(self):
        _form_class = getattr(self, "form_class", None)
        if _form_class:
            return _form_class

        class DefaultForm(forms.ModelForm):
            url_prefix = self.url_prefix
            class Meta:
                model = self.model
                fields = self.form_fields or self.fields

            def __init__(self, *args, **kwargs):
                super(DefaultForm, self).__init__(*args, **kwargs)
                self.helper = FormHelper()
                list_url = reverse_lazy("HappyEventPage:{0}-list-page".format(self.url_prefix))
                layout_fields = [] + self._meta.fields + [
                    Submit('sumbit', _('提交'), css_class="btn btn-lg btn-primary"),
                    HTML('<a class="btn btn-warning" href="{0}">取消</a>'.format(list_url)),
                ]
                self.helper.layout = Layout(*layout_fields)

        return DefaultForm

    def detail_view(self):
        class PageDetailView(DetailView):
            model = self.model
            title = u"%s明细" % self.verbose_name()
            template_name = self.detail_template_name
            success_url = reverse_lazy("HappyEventPage:{0}-list-page".format(self.url_prefix))
            form_class = self.get_form_class()
            url_prefix = self.url_prefix

            def get_context_data(self, **kwargs):
                kwargs["form"] = self.form_class(instance=self.object)
                object_fields = []
                for f in self.object._meta.fields:
                    f_title = f.verbose_name
                    f_name = f.name
                    f_value = str(getattr(self.object, f.name, ""))
                    object_fields.append({"title" : f_title, "name": f_name, "display_vaule": f_value})
                kwargs["object_fields"] = object_fields
                context = super(PageDetailView, self).get_context_data(**kwargs)
                return context

        return PageDetailView

    def create_view(self):
        class PageCreateView(CreateView):
            model = self.model
            #fields = self.fields
            title = u"创建%s" % self.verbose_name()
            url_prefix = self.url_prefix
            template_name = self.create_template_name
            success_url = reverse_lazy("HappyEventPage:{0}-list-page".format(self.url_prefix))
            form_class = self.get_form_class()


        return PageCreateView

    def update_view(self):
        class PageUpdateView(UpdateView):
            model = self.model
            #fields = self.fields
            title = u"编辑%s" % self.verbose_name()
            template_name = self.create_template_name
            url_prefix = self.url_prefix
            success_url = reverse_lazy("HappyEventPage:{0}-list-page".format(self.url_prefix))
            form_class = self.get_form_class()
            url_prefix = self.url_prefix

        return PageUpdateView

    def delete_view(self):
        class PageDeleteView(DeleteView):
            title = u"删除%s" % self.verbose_name()
            model = self.model
            success_url = reverse_lazy("HappyEventPage:{0}-list-page".format(self.url_prefix))
            url_prefix = self.url_prefix
            template_name = self.delete_template_name

        return PageDeleteView
