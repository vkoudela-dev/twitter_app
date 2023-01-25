from django.contrib import admin
from .models import Follower, User, Tweet, Like

# Register your models here.
admin.site.register(User)
admin.site.register(Tweet)
admin.site.register(Follower)
admin.site.register(Like)