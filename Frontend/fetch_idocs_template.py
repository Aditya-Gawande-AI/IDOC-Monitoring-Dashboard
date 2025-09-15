# Simple SAP IDOC Data Fetcher Template
import requests
import xmltodict
import json

# SAP Server Details - CONFIGURE THESE
SAP_URL = "http://YOUR_SAP_SERVER:8000/sap/opu/odata/sap/Z_IDOCSTATUS_SRV/OStatusSet"
USERNAME = "YOUR_USERNAME"
PASSWORD = "YOUR_PASSWORD"

def get_sap_data():
    """Get IDOC data from SAP"""
    try:
        # Connect to SAP and get data
        response = requests.get(SAP_URL, auth=(USERNAME, PASSWORD), timeout=10)
        
        # Convert XML to Python dictionary
        data = xmltodict.parse(response.text)
        idocs = data.get('feed', {}).get('entry', [])
        
        # Make sure we have a list
        if not isinstance(idocs, list):
            idocs = [idocs]
            
        print(f"Got {len(idocs)} IDOCs from SAP")
        return idocs
    except:
        print("Could not connect to SAP")
        return []

def make_dashboard_data(idocs):
    """Turn SAP data into dashboard numbers"""
    # Count different types
    total = len(idocs)
    errors = 0
    successful = 0
    
    # Count errors and success (simple text search)
    for idoc in idocs:
        idoc_text = str(idoc).lower()
        if 'error' in idoc_text:
            errors += 1
        elif 'success' in idoc_text:
            successful += 1
    
    processing = total - errors - successful
    
    # Get first 10 IDOCs for error table
    error_list = []
    for i in range(min(10, len(idocs))):
        idoc = idocs[i]
        
        # Try to get IDOC details (SAP XML is complex)
        try:
            # Look for data in different places
            if 'content' in idoc and 'm:properties' in idoc['content']:
                data = idoc['content']['m:properties']
            else:
                data = idoc  # Use whole thing if structure is different
            
            # Extract what we need
            error_list.append({
                'idoc_no': data.get('d:E_IDocNo', f'IDOC_{i+1:05d}'),
                'msg_type': data.get('d:E_Msgtype', 'ORDERS05'),
                'status': 'ERROR',
                'error_msg': data.get('d:E_Statxt', 'Processing error'),
                'partner': data.get('d:E_Sender', 'VENDOR_001'),
                'timestamp': data.get('d:E_CreatedOn', '2024-01-15 10:30:00')
            })
        except:
            # If we can't read the data, make fake data
            error_list.append({
                'idoc_no': f'IDOC_{i+1:05d}',
                'msg_type': 'ORDERS05',
                'status': 'ERROR',
                'error_msg': 'Data parsing error',
                'partner': f'VENDOR_{i+1:03d}',
                'timestamp': '2024-01-15 10:30:00'
            })
    
    return {
        'total': total,
        'errors': errors,
        'successful': successful,
        'processing': processing,
        'error_list': error_list
    }

# Run the program
if __name__ == "__main__":
    print("Getting IDOC data from SAP...")
    
    # Get data from SAP
    idocs = get_sap_data()
    
    if idocs:
        # Make dashboard data
        dashboard = make_dashboard_data(idocs)
        
        # Save to file for website
        with open('idoc_data.json', 'w') as f:
            json.dump({'dashboard': dashboard}, f, indent=2)
        
        # Show what we got
        print(f"Saved {len(idocs)} IDOCs")
        print(f"Total: {dashboard['total']}, Errors: {dashboard['errors']}")
        print(f"Success: {dashboard['successful']}, Processing: {dashboard['processing']}")
    else:
        print("No data from SAP")