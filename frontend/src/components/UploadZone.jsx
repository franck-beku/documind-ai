import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'

const ACCEPTED = {
  'application/pdf':  ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png':  ['.png'],
}
const MAX_SIZE = 50 * 1024 * 1024 // 50MB

export default function UploadZone({ onFile, loading }) {
  const onDrop = useCallback(accepted => {
    if (accepted.length > 0) onFile(accepted[0])
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled: loading,
  })

  const rejection = fileRejections[0]?.errors[0]

  return (
    <div className="mb-7">
      <div
        {...getRootProps()}
        style={{
          border: `1.5px dashed ${isDragActive ? '#3b82f6' : '#253040'}`,
          borderRadius: 12,
          padding: '36px 24px',
          textAlign: 'center',
          background: isDragActive ? '#3b82f620' : '#0d1117',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all .15s',
          opacity: loading ? .6 : 1,
        }}
      >
        <input {...getInputProps()} />
        <Upload
          size={36}
          color={isDragActive ? '#3b82f6' : '#374355'}
          style={{ margin: '0 auto 12px' }}
        />
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 600, color: '#b8c5d4', marginBottom: 6 }}>
          {loading ? 'Téléversement en cours…' : isDragActive ? 'Déposez le fichier ici' : 'Déposez votre document ici'}
        </div>
        <div style={{ fontSize: 13, color: '#374355' }}>
          ou cliquez pour sélectionner — max 50 MB, 200 pages
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
          {['PDF', 'DOCX', 'JPG', 'PNG'].map(f => (
            <span
              key={f}
              style={{
                fontSize: 11, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
                padding: '3px 8px', borderRadius: 4,
                background: '#131920', border: '1px solid #1c2530', color: '#8a9bb0',
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
      {rejection && (
        <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8, textAlign: 'center' }}>
          {rejection.code === 'file-too-large'
            ? 'Le document dépasse la taille maximale de 50 MB.'
            : 'Format non supporté. Formats acceptés : PDF, DOCX, JPG, PNG.'}
        </p>
      )}
    </div>
  )
}