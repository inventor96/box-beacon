<p>Hi {{$first_name}},</p>
<p>Welcome to Box Beacon!</p>
<p>To verify your email, go to <a href="{{route:'auth:activate', ['token' => $token]}}">{{route:'auth:activate', ['token' => $token]}}</a>.</p>
<p>Sincerely,<br>The Box Beacon Team</p>