<script>
	// @ts-nocheck
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	const queryString = $page.url.search;
	const params = queryString ? new URLSearchParams(queryString) : undefined;
	let email = params && params.has('eingeladen') ? params.get('eingeladen') : '';
	const getInvitee = async (email) => {
		if (!email) {
			alert('Das Feld "E-Mail-Adresse" darf nicht leer sein.');
			return;
		}
		const res = await fetch(`/eingeladene/by-email.json?email=${email}`);
		if (res.ok) {
			const data = await res.json();
			if (data.error) {
				alert(data.error);
			} else {
				goto(`/eingeladene/${data.invitee.slug}`);
			}
		} else {
			const { error } = await res.json();
			alert(error);
		}
	};
</script>

<svelte:head>
	<title>42-24 - Geburtstagsfeier-Anmeldung</title>
</svelte:head>

<article class="mt-6 bg-base-100 shadow-lg py-4 px-6">
	<h2 class="text-3xl font-extrabold mb-6">Ein besonderer Grund zu feiern!</h2>
	<div class="prose">
		<blockquote><p>The Ultimate Answer to Life, The Universe and Everything is...42!</p></blockquote>
		<p><em>― Douglas Adams, The Hitchhiker's Guide to the Galaxy</em></p>
	</div>
	<p class="text-xl mb-4">
		Man wird nur einmal im Leben 42 und wenn dies dann auch noch an einem 24. passiert, in einem Jahr in dem die Summen der
		beiden optischen Hälften der Jahreszahl wiederum 42 ergeben, dann ist dies ein so einmaliges Ereignis, welches es um ein
		Vielfaches lohnenswerter macht, gefeiert zu werden, als ein x-beliebiger runder Geburtstag... die kommen immerhin alle 10
		Jahre, aber das hier passiert nur ein einziges Mal!
	</p>
	<p class="text-xl mb-4">
		Aus diesem Grund lade ich Familienmitglieder, alte Freunde und Bekannte sowie (falls vorhanden) deren Partner und Nachwuchs
		herzlich ein, diesen besonderen Tag gemeinsam mit mir zu feiern... beziehungsweise nachzufeiern.
	</p>
	<p class="text-xl mb-4">
		Es gibt nämlich zwei, auf vier Events aufgeteilte Feiern:<br />
		Direkt an meinem Geburtstag gibt es ein großes Festessen für Familie, alte Freunde und Bekannte mit anschließender After-Party
		in der alten Heimat.<br />
		Zwei Wochen darauf findet dann die Nachfeier für alle Freunde, Kolleginnen und Kollegen in meiner Wahlheimat statt.
	</p>
	<p class="text-xl mb-4">
		Diese Website dient dem Zweck der Veranstaltungsplanung, damit ich für jedes Event im Blick habe, wie viele Personen an
		welcher Feier teilnehmen werden. Dies ist für meine Planung und Kostenabschätzung von essentieller Bedeutung, da hiervon
		Reservierungsangaben und Einkaufskosten abhängen.
	</p>
	<p class="text-xl mb-4">
		Ich möchte Dich daher bitten, hier anzugeben, an welchem der geplanten Termine du teilnehmen möchtest und wie viele Personen
		Du jeweils mitzubringen gedenkst.
	</p>
	<hr class="my-6 bg-black border-black" />
	<p class="text-xl mb-6 font-semibold">
		Wenn Du auf dieser Seite bist, bedeutet das, dass ich Dir einen Link habe zukommen lassen. Bitte trage Deine E-Mail-Adresse,
		an die ich den Link geschickt hatte, in das folgende Feld ein, um fortzufahren:
	</p>
	<form
		method="post"
		action=""
		on:submit={(e) => {
			e.preventDefault();
			getInvitee(email);
		}}
		class="flex justify-center items-end flex-wrap"
	>
		<div class="form-control w-full max-w-xs mr-4 mb-2">
			<label class="label" for="email">
				<span class="label-text text-base">E-Mail-Adresse:</span>
			</label>
			<input id="email" type="email" bind:value={email} class="input input-bordered" />
		</div>
		<button type="submit" disabled={!email} class="btn btn-primary mb-2">Bestätigen</button>
	</form>
</article>
