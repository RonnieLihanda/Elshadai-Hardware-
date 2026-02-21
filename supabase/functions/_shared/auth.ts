const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'elshadai_secret_key_2026';

export interface UserPayload {
  id: number;
  username: string;
  role: string;
  fullName: string;
}

// Base64url encoding/decoding helpers
function base64urlEncode(data: ArrayBuffer): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  return new Uint8Array([...binary].map(char => char.charCodeAt(0)));
}

export async function createToken(payload: UserPayload): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + (8 * 60 * 60); // 8 hours

  const jwtPayload = {
    id: payload.id,
    username: payload.username,
    role: payload.role,
    fullName: payload.fullName,
    iat,
    exp
  };

  const encodedHeader = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64urlEncode(new TextEncoder().encode(JSON.stringify(jwtPayload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signingInput)
  );

  const encodedSignature = base64urlEncode(signature);
  return `${signingInput}.${encodedSignature}`;
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return null;
    }

    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = base64urlDecode(encodedSignature);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(signingInput)
    );

    if (!isValid) {
      return null;
    }

    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(encodedPayload)));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.id,
      username: payload.username,
      role: payload.role,
      fullName: payload.fullName
    };
  } catch {
    return null;
  }
}

export function getTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

export async function authenticateRequest(req: Request): Promise<UserPayload | Response> {
  const token = getTokenFromHeader(req);

  if (!token) {
    return new Response(
      JSON.stringify({ message: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const user = await verifyToken(token);

  if (!user) {
    return new Response(
      JSON.stringify({ message: 'Invalid or expired token' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return user;
}

export function requireAdmin(user: UserPayload): Response | null {
  if (user.role !== 'admin') {
    return new Response(
      JSON.stringify({ message: 'Admin access required' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return null;
}
