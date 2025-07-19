## 🧪 TL;DR Architecture Overview

* **Backend**: Supabase Realtime (Postgres `messages` table)
* **Frontend**: React Native + Supabase JS client
* **Realtime**: Supabase’s built-in `realtime` listens to inserts
* **Auth**: Ensure only sender/receiver can access chat (RLS)
* **Optional**: Push notifications (via OneSignal or Expo)

---

## 🧱 1. Database Table: `messages`

Make sure your `messages` table looks like this:

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id),
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT now()
);
```

### 2. RLS Policy (Row-Level Security)

Allow only sender or receiver to `SELECT` or `INSERT`:

```sql
-- SELECT policy
CREATE POLICY "Users can read their messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- INSERT policy
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
  );
```

## 📤 3. Sending a Message

```ts
async function sendMessage({ itemId, receiverId, message }) {
  const { data, error } = await supabase.from('messages').insert([
    {
      item_id: itemId,
      sender_id: user.id,
      receiver_id: receiverId,
      message,
    },
  ]);
  if (error) console.error('Message error:', error);
}
```

---

## 📥 4. Realtime Message Listener (Subscription)

Use Supabase’s realtime channel to listen to new `INSERT`s:

```ts
useEffect(() => {
  const channel = supabase
    .channel(`messages:item-${itemId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `item_id=eq.${itemId}`,
      },
      (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [itemId]);
```

✅ This ensures you only get messages for the current `item_id`.

---

## 💬 5. Chat UI (Minimal Bubble)

```jsx
{messages.map((msg) => (
  <View
    key={msg.id}
    style={[
      styles.bubble,
      msg.sender_id === user.id ? styles.mine : styles.theirs,
    ]}
  >
    <Text>{msg.message}</Text>
    <Text style={styles.timestamp}>{formatTime(msg.sent_at)}</Text>
  </View>
))}
```

```js
const styles = StyleSheet.create({
  bubble: { padding: 10, borderRadius: 12, margin: 4, maxWidth: '70%' },
  mine: { alignSelf: 'flex-end', backgroundColor: '#3A8DFF', color: 'white' },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#F2F2F2' },
});
```

---

## 🔒 6. Security Recap

| Layer       | How it’s handled              |
| ----------- | ----------------------------- |
| Access      | RLS (sender or receiver)      |
| Auth        | Supabase Auth (JWT)           |
| Encryption  | TLS from client to Supabase   |
| Push Notify | Use Expo/OneSignal (optional) |

---

## 🔔 7. Optional: Push Notifications

Use **Supabase Functions + OneSignal** or **Expo Notifications**:

* On `messages` table `INSERT` → trigger webhook
* Backend function calls OneSignal or Firebase
* Notify the `receiver_id` only