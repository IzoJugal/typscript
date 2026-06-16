import React, { useEffect, useState } from 'react';
import axios, { Method } from 'axios';
import { apiUrl } from '../environment/env';
import { BiCopy } from 'react-icons/bi';

const httpMethods: Method[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const user = localStorage?.user ? JSON.parse(localStorage.user) : undefined;
const token = user ? user.token : undefined;

const TestAPIs: React.FC = () => {
    const [url, setUrl] = useState<string>(apiUrl);
    const [method, setMethod] = useState<Method>('GET');
    const [headers, setHeaders] = useState<string>(
        `{
          "Content-Type": "application/json",
          "Time-Zone": "Asia/Kolkata",
          "Authorization": "Bearer ${token}"
        }`
    );

    const [body, setBody] = useState<string>('{}');
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        document.title = url || 'Test API';
    }, [url]);
    const handleSendRequest = async () => {
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const parsedHeaders = headers ? JSON.parse(headers) : {};
            const parsedBody = body ? JSON.parse(body) : {};

            /* const response = await apiClient.request({
                method, // e.g. 'GET', 'POST'
                url,
                headers: parsedHeaders,
                data: ['POST', 'PUT', 'PATCH'].includes(method) ? parsedBody : undefined,
            }); */
            const response = await axios({
                url,
                method,
                headers: parsedHeaders,
                data: ['POST', 'PUT', 'PATCH'].includes(method) ? parsedBody : undefined,
            });
            setResponse(response);
        } catch (err: any) {
            setError(err.message || 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">🧪 API Tester</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">HTTP Method:</label>
                <select
                    value={method}
                    onChange={e => setMethod(e.target.value as Method)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                >
                    {httpMethods.map(m => (
                        <option key={m} value={m}>
                            {m}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Request URL:</label>
                <input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    placeholder="https://api.example.com/endpoint"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Headers (JSON):</label>
                <textarea
                    rows={4}
                    value={headers}
                    onChange={e => setHeaders(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                    placeholder={`{\n  "Content-Type": "application/json"\n}`}
                />
            </div>

            {['POST', 'PUT', 'PATCH'].includes(method) && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body (JSON):</label>
                    <textarea
                        rows={6}
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                        placeholder={`{\n  "key": "value"\n}`}
                    />
                </div>
            )}

            <button
                onClick={handleSendRequest}
                disabled={loading}
                className={`px-5 py-2 rounded-md text-white font-medium ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
            >
                {loading ? 'Sending...' : 'Send Request'}
            </button>

            {error && (
                <div className="mt-4 text-red-600 font-medium">
                    ❌ Error: {error}
                </div>
            )}

            {response && (
                <div className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Response</h3>

                    <div className="mb-4">
                        <span className="font-medium text-gray-700">Status:</span>{' '}
                        <span className="text-green-600 font-bold">{response.status}</span>
                    </div>

                    <div className="mb-4">
                        <h4 className="font-medium text-gray-700">Headers:</h4>
                        <pre className="bg-gray-100 text-sm p-4 rounded-md overflow-auto">
                            {JSON.stringify(response.headers, null, 2)}
                        </pre>
                    </div>

                    <div className="relative">
                        <h4 className="font-medium text-gray-700 mb-1">Data:</h4>

                        <button
                            onClick={() => navigator.clipboard.writeText(JSON.stringify(response.data, null, 2))}
                            className="absolute top-0 right-0 mt-1 mr-1 text-sm text-DARK-600 hover:text-DARK-800 flex gap-2"
                            title="Copy to clipboard"
                        >
                            <BiCopy className='my-auto h-4 w-4' /> Copy
                        </button>

                        <pre className="bg-gray-100 text-sm p-4 rounded-md overflow-auto">
                            {JSON.stringify(response.data, null, 2)}
                        </pre>
                    </div>

                </div>
            )}
        </div>
    );
};

export default TestAPIs;
