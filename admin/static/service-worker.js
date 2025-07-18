self.addEventListener('push', (event) => {
	const data = event.data.json();
	const options = {
		body: data.body,
		icon: '/path/to/icon.png',
		badge: '/path/to/badge.png'
	};

	event.waitUntil(
		self.registration.showNotification(data.message, options).then(() => {
			self.registration.getNotifications().then((notifications) => {
				notifications.forEach((notification) => {
					notification.close();
				});
			});
			return self.registration.getNotifications();
		})
	);
});
