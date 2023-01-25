
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Routes
    path("network/tweet", views.save_post, name="save_post"),
    path("network/follow", views.follow, name="follow"),
    path("network/all_posts", views.all_posts, name="all_posts"),
    path("network/following", views.following, name="following"),
    path("network/profile", views.profile, name="profile"),
    path("network/like", views.like, name="like"),
    path("network/load_tweets", views.load_tweets, name="load_tweets")
]
