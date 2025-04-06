const jwtHelper = require('../utils/jwtHelper');
const AdminWallet = require('../models/adminWalletModel')


const loadWallet = async(req,res)=>{
    try {
        const token = req.cookies.adminToken;
        if (!token || !jwtHelper.verifyToken(token)) {
        return res.redirect('/admin/login');
    }

    const page = parseInt(req.query.page) || 1
    const limit = 5
    const skip = (page -1) * limit

    const transactions = await AdminWallet.find({})
    .populate('user','name email')
    .sort({createdAt : -1})
    .skip(skip)
    .limit(limit)

    const typeMapping={
        credit:'Credit',
        debit:'Debit',
        refund:'Debit',
        cancellation:'Debit'
    }

    transactions.forEach(txn =>{
        txn.displayType =  typeMapping[txn.transactionType.toLowerCase()] || txn.transactionType
        txn.formattedDate = new Date(txn.transactionDate).toLocaleDateString()
    })

    const totalTotalDepositsAgg = await AdminWallet.aggregate([
        {$match: {transactionType:{$in: ['credit']}}},
        {$group: {_id: null,total: {$sum: '$amount'}}}
    ])

    const totalWithdrawalAgg = await AdminWallet.aggregate([
        {$match: {transactionType: {$in: ['refund','cancellation','debit']}}},
        {$group: {_id: null,total: {$sum: '$amount'}}}
    ])

    const totalDeposits = totalTotalDepositsAgg[0] ? totalTotalDepositsAgg[0].total : 0
    const totalWithdrawals = totalWithdrawalAgg[0] ? totalWithdrawalAgg[0].total : 0

    const adminBalance = totalDeposits -totalWithdrawals
    
    const totalItems = await AdminWallet.countDocuments()
    const totalPages= Math.ceil(totalItems / limit)




    res.render('admin/adminWallet',{transactions,currentPage:page,totalPages,totalDeposits,totalWithdrawals,totalItems,adminBalance,limit})
        
    } catch (error) {
        console.error('Error loading wallet',error);
        res.status(500).send('Server Error');
        
    }
  
}

const viewDetails = async(req,res)=>{
    try {
        
        const token = req.cookies.adminToken;
        if (!token || !jwtHelper.verifyToken(token)) {
            return res.redirect('/admin/login');
        }

        const transactionId = req.params.id
    
        const transaction = await AdminWallet.findById(transactionId)
        .populate('user','name email')
        .populate('order','orderNumber')

        if(!transaction){
            return res.status(400).json({
                success:false,
                message:'Transaction not found'
            })
        }

        const response={
            id:transaction._id,
            transactionType:transaction.transactionType,
            amount:transaction.amount,
            transactionDate:transaction.transactionDate,
            source:transaction.source || 'N/A',
            user: {
                name: transaction.user?.name || 'Unknown',
                email: transaction.user?.email || 'Unknown'
            },
            orderNumber: transaction.order?.orderNumber || null
        }

        return res.status(200).json({success:true,transaction:response})
    } catch (error) {
        console.error('Error in viewDetails controller:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = {
    loadWallet,
    viewDetails
}