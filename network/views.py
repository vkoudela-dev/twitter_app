import json
from pickle import FALSE
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.db.models import Count
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import *
from .utils import *

def index(request):
    if request.user.is_authenticated:
        return render(request, "network/index.html")
    
    else:
        return HttpResponseRedirect(reverse("login"))

#  Query all tweets from database
@login_required
def all_posts(request):
    tweets = Tweet.objects.all().annotate(likes=Count('like')).order_by("-timestamp")

    #  Create pagination
    context = paginator(1, tweets)

    return JsonResponse(context)

#  Send another batch of tweets upon request
@csrf_exempt
@login_required
def load_tweets(request):
    tweets = Tweet.objects.all().annotate(likes=Count('like')).order_by("-timestamp")
    data = json.loads(request.body)
    page = data.get('page', '')
    following_page = data.get('following_page', '')
    
    if following_page:
        tweets = following(request, page)

    #  Create pagination
    context = paginator(page, tweets)

    return JsonResponse(context)

#  Process data for Profile view
@login_required
def profile(request):

    #  Get logged in user's data
    user = User.objects.get(username=request.user)
    user_id = user.id

    #  Count of followed users, count of followers, logged in user's tweets
    users, following_users, following_count = queryUsers(user_id)
    followers_count = Follower.objects.filter(followed=user_id).count()
    tweets = Tweet.objects.annotate(likes=Count('like')).filter(user=user_id)

    #  Tweets pagination
    context = paginator(1, tweets)

    data = {
        'following_count': following_count,
        'followers_count': followers_count,
        'following_users': following_users,
        'users': [user.username for user in users]
        }

    context |= data

    return JsonResponse(context)

#  Process follow or unfollow request
@csrf_exempt
@login_required
def follow(request):

    #  Get data from Json
    data = json.loads(request.body)
    tweet_user = data.get('followed', "")
    followed_user = User.objects.get(username=tweet_user)
    user = User.objects.get(username=request.user)
    user_id = user.id

    #  Check if another user is already followed
    instance_following, created = Follower.objects.get_or_create(user=user)

    #  If followed, unfollow that user
    if instance_following.followed.filter(username=followed_user).exists():
        instance_following.followed.remove(followed_user)

    #  If that user is not followed, follow that user
    else:
        instance_following.followed.add(followed_user)

    users, following_users, following_count = queryUsers(user_id)
    data = {
        'following_count': following_count,
        'following_users': following_users,
        'users': [user.username for user in users]
    }

    return JsonResponse(data)

#  Process data for Following page
@login_required
def following(request=None, page=None):
    followed_querysets = None

    #  Check if a Follower instance exists for logged in user
    if Follower.objects.filter(user=request.user).exists():
        instance_following = Follower.objects.get(user=request.user)
        instance_following_list = instance_following.followed.all()

        #  Return if instance exists but no followed users
        if not instance_following_list.exists():
            return JsonResponse({"message": "You don't follow anybody yet!"}, status=200)

        #  Iterate over all followed users and merge their tweets
        for followed_user in instance_following_list:
            followed_user_id = followed_user.id
            user_tweets = Tweet.objects.annotate(likes=Count('like')).filter(user=followed_user_id)
            if followed_querysets == None:
                followed_querysets = user_tweets
            followed_querysets = followed_querysets.union(user_tweets)

        #  Ordering tweets
        if len(followed_querysets) > 1:
            tweets = followed_querysets.order_by("-timestamp").all()
        else:
            tweets = followed_querysets

        if page:
            return tweets

        #  Create jsonResponse with pagination
        context = paginator(page, tweets)

        return JsonResponse(context)

    #  Return if no instance
    else:
        return JsonResponse({"message": "You don't follow anybody yet!"}, status=200)      

#  Save, edit or delete user's tweet
@csrf_exempt
@login_required
def save_post(request):
    #  Check POST method
    if request.method != "POST":
        return JsonResponse({'error': "POST request required"}, status=400)

    #  Retrieve data from Json
    data = json.loads(request.body)
    text = data.get("text", "")

    #  If no text sent when editing, delete tweet
    if data.get("tweet_id", ""):
        if not text:
            Tweet.objects.filter(pk=data.get("tweet_id", "")).delete()

            return JsonResponse({"message": "Deleted successfully"}, status=201)

        #  Edit tweet
        Tweet.objects.filter(pk=data.get("tweet_id", "")).update(text=text)

        return JsonResponse({"message": "Edited successfully"}, status=201)

    #  Save tweet
    else:
        user = User.objects.get(username=request.user)
        tweet = Tweet()
        tweet.user_id = int(user.id)
        tweet.text = data.get("text", "")
        tweet.save()

        return JsonResponse({"message": "Posted successfully"}, status=201)

#  Like or Unlike tweet
@csrf_exempt
@login_required 
def like(request):

    #  Retrieve data from Json
    data = json.loads(request.body)
    tweet_id = data.get("tweet_id", "")
    tweet = Tweet.objects.get(pk=tweet_id)

    #  Get like if exists, otherwise create
    like_instance, created = Like.objects.get_or_create(user=request.user, tweet=tweet)

    #  Return count of likes for liked tweet if like was created
    if created:
        likes_count = Like.objects.filter(tweet=tweet).count()

    #  If like exists, delete and update count of likes
    else:
        like_instance.delete()
        likes_count = Like.objects.filter(tweet=tweet).count()

    return JsonResponse({'likes': likes_count})


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
