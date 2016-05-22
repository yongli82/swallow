from django.shortcuts import render

# Create your views here.
from viewsets.page_view_set import PageViewSet
from models import *

url_router = []

class TagViewSet(PageViewSet):
    url_prefix = "tag"
    model = CustomizeTag
    fields = []
    list_fields = []

url_router += TagViewSet().urlpatterns()

class AddressViewSet(PageViewSet):
    url_prefix = "address"
    model = Address
    fields = []
    list_fields = []

url_router += AddressViewSet().urlpatterns()

class EventViewSet(PageViewSet):
    url_prefix = "event"
    model = Event
    fields = []
    list_fields = []

url_router += EventViewSet().urlpatterns()

