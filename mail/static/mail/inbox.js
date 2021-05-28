document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = send_email;


  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-display').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-display').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      // get new emails 
      emails.forEach((email_elem) => {
        const parent_elem = document.createElement('div');
        add_emails(email_elem, parent_elem, mailbox);

        parent_elem.addEventListener("click", () => open_email(email_elem["id"]));
        document.querySelector('#emails-view').appendChild(parent_elem);
      });

      })
}

//Add new email with given contents to DOM
function add_emails(email_elem, parent_elem, mailbox) {
  if (mailbox === "inbox" && email_elem["archived"]) {
    return;
  }
  else if (mailbox === "archive" && !email_elem["archived"]) {
    return;
  }

  //Create new post
  const content = document.createElement('div');
  const recipients = document.createElement('strong');
  if (mailbox === 'sent') {
    recipients.innerHTML = email_elem['recipients'].join(',') + ' ';
  }
  else {
    recipients.innerHTML = email_elem['sender'] + ' ';
  }
  content.appendChild(recipients);

  // Set and style the date.
  const date = document.createElement("div");
  date.innerHTML = email_elem["timestamp"];
  date.style.display = "inline-block";
  date.style.float = "right";

  if (email_elem["read"]) {
    parent_elem.style.backgroundColor = "grey";
    date.style.color = "black";
  } else {
    date.className = "text-muted";
  }
  content.appendChild(date);

  content.style.padding = "10px";
  parent_elem.appendChild(content);


  // Style the parent element.
  parent_elem.style.borderStyle = "solid";
  parent_elem.style.borderWidth = "3px";
  parent_elem.style.margin = "10px";
  
}

function open_email(id) {
  // Show email-display and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-display').style.display = 'block';
  

  // clearing previous content
  document.querySelector('#email-display').innerHTML = '';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);
      
        const from = document.createElement("div");
        const to = document.createElement("div");
        const subject = document.createElement("div");
        const timestamp = document.createElement("div");
        const reply_button = document.createElement("button");
        const archive_button = document.createElement("button");
        const body = document.createElement("div");

        from.innerHTML = `<strong>From: </strong> ${email["sender"]}`;
        to.innerHTML = `<strong>To: </strong> ${email["recipients"].join(", ")}`;
        subject.innerHTML = `<strong>Subject: </strong> ${email["subject"]}`;
        timestamp.innerHTML = `<strong>Timestamp: </strong> ${email["timestamp"]}`;
        body.innerHTML = email["body"];

        
      
        // * Archive button
        archive_button.innerHTML = '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-archive-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M12.643 15C13.979 15 15 13.845 15 12.5V5H1v7.5C1 13.845 2.021 15 3.357 15h9.286zM5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM.8 1a.8.8 0 0 0-.8.8V3a.8.8 0 0 0 .8.8h14.4A.8.8 0 0 0 16 3V1.8a.8.8 0 0 0-.8-.8H.8z"/></svg>  ';
        if (email["archived"]) {
          archive_button.innerHTML = "Unarchive";
        } else {
          archive_button.innerHTML = "Archive";
        }
        archive_button.classList = "btn btn-outline-primary m-2";
        archive_button.addEventListener("click", () => {
          archive_email(email);
          load_mailbox("inbox");
        });

        // * Reply button
        reply_button.innerHTML = 'Reply';
      
        reply_button.classList = "btn btn-outline-primary m-2";
        reply_button.addEventListener("click", () => reply_email(email));

        document.querySelector("#email-display").appendChild(from);
        document.querySelector("#email-display").appendChild(to);
        document.querySelector("#email-display").appendChild(subject);
        document.querySelector("#email-display").appendChild(timestamp);
        document.querySelector("#email-display").appendChild(archive_button);
        document.querySelector("#email-display").appendChild(reply_button);
        document.querySelector("#email-display").appendChild(document.createElement("hr"));
        document.querySelector("#email-display").appendChild(body);

        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })
  });

}

function reply_email(email) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-display').style.display = 'none';

  // Clear out and prefill composition fields
  document.querySelector('#compose-recipients').value = email['sender'];
  document.querySelector('#compose-subject').value = ((email["subject"].match(/^(Re:)\s/)) ? email["subject"] : "Re: " + email["subject"]);
  document.querySelector('#compose-body').value = `On ${email["timestamp"]} ${email["sender"]} wrote:\n${email["body"]}\n-------------------------------------\n`;
}

function archive_email(email) {
  fetch(`/emails/${email['id']}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: !email['archived']
    })
  })
}

function send_email() {

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  console.log(recipients)

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body,
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);   
  });
}

