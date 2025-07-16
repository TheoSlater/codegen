import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { parseEnhancedMessage } from '../utils/messageParser';
import ChunkedMessageRenderer from '../components/ChunkedMessageRenderer';

const TestChunkedMessages: React.FC = () => {
  const [testMessage, setTestMessage] = React.useState<string>('');
  const [parsedChunks, setParsedChunks] = React.useState<ReturnType<typeof parseEnhancedMessage> | null>(null);

  const sampleMessage = `I'll create a beautiful React component for you! Let me start with the installation:

\`\`\`bash
npm install lucide-react
\`\`\`

Now here's the complete component file:

---filename: src/components/UserCard.tsx---
import React from 'react';
import { User, Mail, Phone } from 'lucide-react';

interface UserCardProps {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

const UserCard: React.FC<UserCardProps> = ({ name, email, phone, avatar }) => {
  return (
    <div className="max-w-sm mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center space-x-4">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{email}</span>
            </div>
            {phone && (
              <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                <Phone className="w-4 h-4" />
                <span>{phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
---end---

You can now use this component anywhere in your app! The component includes:

- Clean, modern design with Tailwind CSS
- Support for optional avatar images
- Responsive layout
- Lucide React icons for a professional look

Want me to create a usage example as well?`;

  const handleTestMessage = () => {
    setTestMessage(sampleMessage);
    const parsed = parseEnhancedMessage(sampleMessage);
    setParsedChunks(parsed);
  };

  const handleClearMessage = () => {
    setTestMessage('');
    setParsedChunks(null);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Chunked Message Test
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={handleTestMessage}>
          Test Sample Message
        </Button>
        <Button variant="outlined" onClick={handleClearMessage}>
          Clear
        </Button>
      </Box>

      {parsedChunks && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Parsed Chunks: {parsedChunks.chunks.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Has enhanced chunks: {parsedChunks.hasChunks ? 'Yes' : 'No'}
          </Typography>
        </Paper>
      )}

      {testMessage && parsedChunks && (
        <Paper elevation={2} sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            Rendered Result:
          </Typography>
          <ChunkedMessageRenderer 
            chunks={parsedChunks.chunks}
            onCopyCode={(content) => {
              navigator.clipboard.writeText(content);
              console.log('Copied to clipboard:', content.slice(0, 50) + '...');
            }}
          />
        </Paper>
      )}
    </Box>
  );
};

export default TestChunkedMessages;
