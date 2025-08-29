<p>Hi there!</p>
<p>{{ $sender_name }} has invited you to participate in managing their "{{ $move_name }}" move with Box Beacon!</p>
<p>To accept this invitation, go to <a href="{{route:'invites:accept', ['token' => $token]}}">{{route:'invites:accept', ['token' => $token]}}</a>.</p>
<p>Sincerely,<br>The Box Beacon Team</p>