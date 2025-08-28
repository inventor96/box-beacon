# Box Beacon
Box Beacon is a web app for tracking boxes during a move.

## Features
- Create and manage moves
- Share moves with others
- Create and manage rooms (both current and new)
- Assign colors to rooms
- Create and manage boxes
- Identify boxes by a simple numbering system
- Assign boxes to "from" and "to" rooms
- Add tags to boxes (e.g. fragile, heavy)
- Add and manage multiple items within each box
- Print simple identifying labels for boxes
	- Labels do not include box details, allowing you to change things without needing to reprint the labels
- Track box contents (items) and their locations

## How to Use It
Box Beacon is box-centric, meaning that everything revolves around the boxes you are moving. The bare minimum is to create a "move". Optionally, you can add "from" and "to" rooms to the move so they're available when managing boxes. Then, create boxes as you go! You can create one box at a time, or you can create multiple boxes at once and immediately print labels for them. If you don't want to print labels, you can just write the box number on each box with a marker.

Overall, the idea is to allow you to keep track of each box without worrying about the details right off the bat (i.e. you can identify the box first, and then add details once you've packed it). You can add items to each box and track their contents and locations throughout the moving process.

## License
Licensed under the MIT NonCommercial License (MIT-NC). See [LICENSE](LICENSE) for details.

Basically, you can use it for personal, non-commercial projects. But you can't sell it, use it for commercial purposes, or otherwise make a profit from it.

## Development
This project is built with the [Mako Framework](https://makoframework.com/docs/10.0) (PHP 8.1+), and Vue 3 using the Composition API and SFCs (Single File Components), with [Inertia.js](https://inertiajs.com/) to glue the frontend and backend together. Composer is used to manage PHP packages, NPM is used to manage JavaScript packages, and Vite is used for asset bundling and development. Database functionality is built for MySQL/MariaDB, but Mako technically supports other databases as well.